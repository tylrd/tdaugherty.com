---
title: "Securely Introducing Secrets into Google Compute Instances"
date: 2019-02-19T17:59:55-05:00
draft: true
---

I recently needed to get a secret into a personal GCP instance. I wanted to stay
in the "Google Ecosystem" as much as possible, so I chose to use Google KMS and
a metadata startup script.

The metadata startup script will execute every time the instance boots up. This
script reaches out Google Cloud Storage to retrieve an encrypted secret in a
bucket. The service account attached to the instance has least-privilege scopes
that allow it to download the encrypted file and decrypt the file with `gcloud`.

I encrypted my secret data and stored it in a bucket with the following command:

```bash
KMS_KEYRING_NAME="pki"
KMS_KEY_NAME="ca"
SECRET_PATH="${bucket}/private/vpn/passphrase.enc"

cat my-secret.txt | gcloud kms encrypt \
  --location global \
  --keyring "$KMS_KEYRING_NAME" \
  --key "$KMS_KEY_NAME" \
  --ciphertext-file - \
  --plaintext-file - \ 
  | gsutil cp - "$SECRET_PATH"
```

Next, I wrote the metadata script that retrieves the secret, decrypts it, and
renders the plaintext out into a file.

```bash
KMS_KEYRING_NAME="pki"
KMS_KEY_NAME="ca"
SECRET_PATH="${bucket}/private/vpn/passphrase.enc"

PASSPHRASE=$(gcloud kms decrypt \
  --location global \
  --keyring "$KMS_KEYRING_NAME" \
  --key "$KMS_KEY_NAME" \
  --ciphertext-file <(gsutil cat "$SECRET_PATH") \
  --plaintext-file -)

cat <<EOF > /etc/ipsec.secrets
vpn.example.com : RSA "key.pem" "$PASSPHRASE"
EOF

ipsec restart
```

I added this bash template to my terraform module, and referenced it in the
`google_compute_instance` definition:

```ruby
data "template_file" "setup_vpn" {
  template = "${file("${path.module}/setup_vpn.sh")}"

  vars {
    bucket = ${var.bucket}
  }
}

resource "google_compute_instance" "vpn" {
  name         = "vpn"
  machine_type = "g1-small"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "${data.google_compute_image.vpn.self_link}"
    }
  }

  network_interface {
    subnetwork = "${google_compute_subnetwork.subnet.self_link}"

    access_config {
      nat_ip = "${local.vpn_ip}"
    }
  }

  metadata_startup_script = "${data.template_file.setup_vpn.rendered}"

  tags = ["ipsec"]

  service_account {
    email  = "${data.terraform_remote_state.iam.service_account_email}"
    scopes = [
      "storage-ro",
      "https://www.googleapis.com/auth/cloudkms"
    ]
  }

}
```

The service account attached to the instances needed read-only scopes for GCS
and scopes for KMS. The service account was also granted read-only object access
to the encrypted key, and had a decrypter role for the pki/ca KMS key.

The downside to this method is that if the key changes, I will have to restart
the instances to pick up on a change. A better solution would be to use 
consul-template and Vault. Consul template would watch for changes in the vault
path and render the new template. Alternatively, I could add a cron on this
instance that polls for updates, though that wouldn't be as efficient or cost
efficient as using something like consul-template.
