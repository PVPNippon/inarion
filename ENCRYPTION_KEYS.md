## About rsa keys

- Public Key: Used for encrypting data. It can be shared openly.
- Private Key: Used for decrypting data. It must be kept secret.

In an encryption-decryption flow using RSA (asymmetric encryption), the roles of keys are divided between the client and server for security purposes:

#### Client Private Key:

- Used by the client to decrypt sensitive data sent to it by the server.
- Ensures only the client can decrypt data meant for it.

#### Client Public Key:

- Shared with the server.
- Used by the server to encrypt data that only the client can decrypt.

#### Server Private Key:

- Used by the server to decrypt sensitive data sent to it by the client.
- Ensures only the server can decrypt data meant for it.

#### Server Public Key:

- Shared with the client.
- Used by the client to encrypt data that only the server can decrypt.

Default encryption keys are stored in the project folder.
If you want to generate your own keys, please use the instruction below to generate them and replace the existing ones.

## Steps to generate keys

### Prerequisites

1. Install OpenSSL:

#### Mac/Linux: Comes pre-installed. If not, install via your package manager:

- Ubuntu/Debian

```bash
sudo apt install openssl # Ubuntu/Debian
```

- macOS

```bash
brew install openssl
```

#### Windows: Download it from [OpenSSL](https://www.openssl.org/).

2. Generate Client Private Key:

```bash
openssl genrsa -out private.pem 2048
```

3. Generate Client Public Key:

```bash
openssl rsa -in private.pem -pubout -out public.pem
```

4. Generate Server Private Key:

```bash
openssl genrsa -out private.pem 2048
```

5. Generate Server Public Key:

```bash
openssl rsa -in private.pem -pubout -out public.pem
```

## Storing the keys

Organize and store the keys in the following directory structure within your project:

```bash
/api/keys/
  ├── client_rsa_keys/
  │     ├── private.pem
  │     ├── public.pem
  ├── server_rsa_keys/
        ├── private.pem
        ├── public.pem

```

1. Store Client keys inside /api/keys/client_rsa_keys/
2. Store Server keys inside /api/keys/server_rsa_keys/
3. If the application is running, restart Docker
