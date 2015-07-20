var s3CreateObject = require('../s3_create_object');

describe("S3CreateObject", function() {
  it("loads the handler", function() {
    expect(typeof(s3CreateObject.handler)).toEqual('function');
  });

  describe("UploadedObject", function() {
    beforeEach(function() {
      var bucket = {name: "lunchpail"};
      var object = {key: "mustang"};
      var event = {Records: [{s3: {bucket: bucket, object: object}}]};
      this.succeedSpy = jasmine.createSpy();
      this.failSpy = jasmine.createSpy();
      var context = {succeed: this.succeedSpy, fail: this.failSpy};
      this.uploadedObject = new s3CreateObject.UploadedObject(event, context);
    });

    describe("#toParameters", function() {
      it("presents the bucket and key from the event", function() {
        expect(this.uploadedObject.toParameters()).toEqual({
          Bucket: "lunchpail",
          Key: "mustang"
        });
      });
    });

    describe("#handleSuccess", function() {
      beforeEach(function (){
        this.data = {ContentType: "taco/meat"};
      });

      it("calls the succeed handler with the content type", function() {
        this.uploadedObject.handleSuccess(this.data);
        expect(this.succeedSpy).toHaveBeenCalledWith("taco/meat");
      });
    });

    describe("#handleError", function() {
      beforeEach(function (){
        this.error = "meh";
      });

      it("calls the fail handler with a message", function() {
        this.uploadedObject.handleError(this.error);
        expect(this.failSpy).toHaveBeenCalledWith("Error getting mustang from lunchpail");
      });
    });

    describe("#responseHandler", function() {
      beforeEach(function (){
        spyOn(this.uploadedObject, "handleSuccess");
        spyOn(this.uploadedObject, "handleError");
      });

      it("returns a curried response handler for the success case", function() {
        this.uploadedObject.responseHandler()(null, {});
        expect(this.uploadedObject.handleSuccess).toHaveBeenCalled();
      });

      it("returns a curried response handler for the failure case", function() {
        this.uploadedObject.responseHandler()("wat", null);
        expect(this.uploadedObject.handleError).toHaveBeenCalled();
      });
    });
  });
});
