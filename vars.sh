export PROJECT_ID=$(gcloud config get-value project)
export REGION=asia-northeast1

# set the Cloud Run (fully managed) region
$(gcloud config set run/region $REGION)
