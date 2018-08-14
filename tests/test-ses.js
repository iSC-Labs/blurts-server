"use strict";

const httpMocks = require("node-mocks-http");
const test = require("tape-async");

const DB = require("../db/DB");
const getSha1 = require("../sha1-utils");
const ses = require("../controllers/ses");

const testNotifications = new Map();
testNotifications.set("bounce", require("./ses-bounce-notification.json"));
testNotifications.set("complaint", require("./ses-complaint-notification.json"));


const createRequestBody = function(notificationType) {
  return JSON.stringify(testNotifications.get(notificationType));
};


test("setup", async t => {
  DB.createConnection();
});


test("ses notification with Permanent bounce unsubscribes recipient", async t => {
  const testEmail = "bounce@simulator.amazonses.com";

  await DB.addSubscriber(testEmail);
  let subscribers = await DB.getSubscribersByHashes([getSha1(testEmail)]);
  t.deepEqual(subscribers.length, 1);

  const req = httpMocks.createRequest({
    method: "POST",
    url: "/ses/notification",
    body: createRequestBody("bounce"),
  });
  const resp = httpMocks.createResponse();

  await ses.notification(req, resp);
  t.deepEqual(resp.statusCode, 200);

  subscribers = await DB.getSubscribersByHashes([getSha1(testEmail)]);
  t.deepEqual(subscribers.length, 0);
});


test("ses notification with Complaint unsubscribes recipient", async t => {
  const testEmail = "complaint@simulator.amazonses.com";

  await DB.addSubscriber(testEmail);
  let subscribers = await DB.getSubscribersByHashes([getSha1(testEmail)]);
  t.deepEqual(subscribers.length, 1);

  const req = httpMocks.createRequest({
    method: "POST",
    url: "/ses/notification",
    body: createRequestBody("complaint"),
  });
  const resp = httpMocks.createResponse();

  await ses.notification(req, resp);
  t.deepEqual(resp.statusCode, 200);

  subscribers = await DB.getSubscribersByHashes([getSha1(testEmail)]);
  t.deepEqual(subscribers.length, 0);
});


test("teardown", async t => {
  DB.destroyConnection();
});