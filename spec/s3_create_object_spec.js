var s3CreateObject = require('../s3_create_object');

describe("S3CreateObject", function() {
  beforeEach(function() {
    this.succeedSpy = jasmine.createSpy();
    this.failSpy = jasmine.createSpy();
    this.createJobSpy = jasmine.createSpy();
  });

  it("loads the handler", function() {
    expect(typeof(s3CreateObject.handler)).toEqual('function');
  });

  describe("UntranscodedObject", function() {
    beforeEach(function() {
      var bucket = "fish";
      var key = "rusty";
      var context = {succeed: this.succeedSpy, fail: this.failSpy};
      this.untranscodedObject = new s3CreateObject.UntranscodedObject(bucket, key, context);
    });

    describe("#toParameters", function() {
      it("presents some configuration for an elastic transcoder job", function() {
        expect(this.untranscodedObject.toParameters()).toEqual(
          jasmine.objectContaining({
            OutputKeyPrefix: 'encoded/',
            Input: jasmine.objectContaining({Key: 'rusty'}),
            Outputs: [jasmine.objectContaining({Key: 'rusty.mp4'})]
          })
        );
      });
    });

    describe("#handleSuccess", function() {
      it("calls the succeed handler with the content type", function() {
        this.untranscodedObject.handleSuccess(this.data);
        expect(this.succeedSpy).toHaveBeenCalledWith(
          "Encoded rusty successfully!"
        );
      });
    });

    describe("#handleError", function() {
      it("calls the succeed handler with the content type", function() {
        this.untranscodedObject.handleError("meh");
        expect(this.failSpy).toHaveBeenCalledWith(
          "Failed to send new video rusty to ET"
        );
      });
    });

    describe("#responseHandler", function() {
      beforeEach(function (){
        spyOn(this.untranscodedObject, "handleSuccess");
        spyOn(this.untranscodedObject, "handleError");
      });

      it("returns a curried response handler for the success case", function() {
        this.untranscodedObject.responseHandler()(null, this.data);
        expect(this.untranscodedObject.handleSuccess).toHaveBeenCalled();
      });

      it("returns a curried response handler for the failure case", function() {
        this.untranscodedObject.responseHandler()("wat", null);
        expect(this.untranscodedObject.handleError).toHaveBeenCalled();
      });
    });
  });

  describe("UploadedObject", function() {
    beforeEach(function() {
      var bucket = {name: "lunchpail"};
      var object = {key: "mustang"};
      var event = {Records: [{s3: {bucket: bucket, object: object}}]};
      var et = {createJob: this.createJobSpy};
      var context = {succeed: this.succeedSpy, fail: this.failSpy};
      this.uploadedObject = new s3CreateObject.UploadedObject(event, context, et);
      this.data = {};
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
      it("calls the succeed handler with the content type", function() {
        this.uploadedObject.handleSuccess(this.data);
        expect(this.createJobSpy).toHaveBeenCalledWith(
          jasmine.any(Object), jasmine.any(Function)
        );
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
        this.uploadedObject.responseHandler()(null, this.data);
        expect(this.uploadedObject.handleSuccess).toHaveBeenCalled();
      });

      it("returns a curried response handler for the failure case", function() {
        this.uploadedObject.responseHandler()("wat", null);
        expect(this.uploadedObject.handleError).toHaveBeenCalled();
      });
    });
  });
});
