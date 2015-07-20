var aws = require("aws-sdk");
var s3 = new aws.S3({apiVersion: "2006-03-01"});

var UploadedObject = function(event, context) {
  this.bucket = event.Records[0].s3.bucket.name;
  this.key = event.Records[0].s3.object.key;
  this.context = context;
}

UploadedObject.prototype.toParameters = function uploadObjectParameters() {
  return {
    Bucket: this.bucket,
    Key: this.key
  };
};

UploadedObject.prototype.handleError = function uploadErrorHandler(_) {
  var message = "Error getting " + this.key + " from " + this.bucket;
  this.context.fail(message);
};

UploadedObject.prototype.handleSuccess = function uploadSuccessHandler(data) {
  this.context.succeed(data.ContentType);
};

UploadedObject.prototype.responseHandler = function uploadResponseHandler() {
  var self = this;
  return (function boundResponseHandler(error, data) {
    if (error) {
      self.handleError(error);
    } else {
      self.handleSuccess(data);
    }
  });
};

exports.UploadedObject = UploadedObject;

exports.handler = function(event, context) {
  var uploadedObject = new UploadedObject(event, context);
  s3.getObject(uploadedObject.toParameters(), uploadedObject.responseHandler());
};
