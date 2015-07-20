var aws = require("aws-sdk");
var s3 = new aws.S3({apiVersion: "2006-03-01"});
var et = new aws.ElasticTranscoder({apiVersion: '2012-09-25', region: 'us-west-2'});

var etPipelineId = "1437374070396-179a4g";
var etPresetId = "1351620000001-100070";

var responseHandlerCurrier = function currier() {
  var self = this;
  return function boundResponseHandler(error, data) {
    if (error) {
      self.handleError(error);
    } else {
      self.handleSuccess(data);
    }
  };
};

var UntranscodedObject = function(bucket, key, context) {
  this.bucket = bucket;
  this.key = key;
  this.context = context;
};

UntranscodedObject.prototype.toParameters = function untranscodedObjectParameters() {
  return {
    PipelineId: etPipelineId,
    OutputKeyPrefix: "encoded/",
    Input: {
      Key: this.key,
      FrameRate: "auto",
      Resolution: "auto",
      AspectRatio: "auto",
      Interlaced: "auto",
      Container: "auto"
    },
    Outputs: [
      {
        Key: this.key + ".mp4",
        PresetId: etPresetId
      }
    ]
  };
};

UntranscodedObject.prototype.handleError = function untranscodedErrorHandler() {
  this.context.fail("Failed to send new video " + this.key + " to ET");
};

UntranscodedObject.prototype.handleSuccess = function untranscodedSuccessHandler() {
  this.context.succeed("Encoded " + this.key + " successfully!");
};

UntranscodedObject.prototype.responseHandler = responseHandlerCurrier;

var UploadedObject = function(event, context, et) {
  this.bucket = event.Records[0].s3.bucket.name;
  this.key = event.Records[0].s3.object.key;
  this.context = context;
  this.et = et;
};

UploadedObject.prototype.toParameters = function uploadObjectParameters() {
  return {
    Bucket: this.bucket,
    Key: this.key
  };
};

UploadedObject.prototype.handleError = function uploadErrorHandler() {
  this.context.fail("Error getting " + this.key + " from " + this.bucket);
};

UploadedObject.prototype.handleSuccess = function uploadSuccessHandler() {
  var untranscodedObject = new UntranscodedObject(this.bucket, this.key, this.context);
  this.et.createJob(untranscodedObject.toParameters(), responseHandlerCurrier(untranscodedObject));
};

UploadedObject.prototype.responseHandler = responseHandlerCurrier;

exports.UploadedObject = UploadedObject;
exports.UntranscodedObject = UntranscodedObject;

exports.handler = function(event, context) {
  var uploadedObject = new UploadedObject(event, context, et);
  s3.headObject(uploadedObject.toParameters(), uploadedObject.responseHandler());
};
