---
title: "Deploying a Go HTTP server to Kubernetes"
date: 2019-11-03T13:32:32-05:00
draft: true
---

This article will cover how I deploy a simple go HTTP web server to Kubernetes.
We will start with the most simple example and work our way up to more complex.

# Our application

We will build a small API used for managing $ITEMS.

```bash
$ go mod init
$ go get github.com/julienschmidt/httprouter
```

In a `main.go`, we will add bare minimum code for serving a response at `/`:

```go
package main

import (
  "fmt"
  "log"
  "net/http"
  
  "github.com/julienschmidt/httprouter"
)

func Index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
  fmt.Fprint(w, "Hello!")
}

func main() {
  router := httprouter.New()
  router.GET("/", Index)
  log.Fatal(http.ListenAndServe(":8080", router))
}
```

Verify this code locally:

```
$ go run main.go
$ curl localhost:8080
Hello!
```
