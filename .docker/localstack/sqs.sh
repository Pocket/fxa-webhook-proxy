#!/bin/bash
set -x

SQS=('fxa-events-queue')

for sqs_queue in "${SQS[@]}"; do
  awslocal sqs create-queue --queue-name "${sqs_queue}"
done

set +x
