# JupyterHub Publish Extension

This extension and service allow you to use webdav with your notebooks in JupyterHub

Requirements:

* Using KubeSpawner (i.e. running on top of Kubernetes/OpenShift)
* Installing this repo through pip
* Installing & enabling webdav in your notebook container
* Edit your `jupyterhub_config.py`

## Install and run the publish service
Add git URL to your `requirements.txt` for JupyterHub

```
git+https://github.com/afeiszli/jupyter-webdav-extension.git
```

And add the following to your `jupyterhub_config.py` to enable the service to run

```
import uuid
c.ConfigurableHTTPProxy.auth_token = str(uuid.uuid4())
webdav_service_dict = {
                        'PROXY_TOKEN': c.ConfigurableHTTPProxy.auth_token,
                        'PROXY_API_URL': 'http://%s:%d/' % ("127.0.0.1", 8082)
                    }
webdav_service_dict.update(os.environ)
c.JupyterHub.services = [
                            {
                                'name': 'webdav',
                                'command': ['bash', '-c', 'jupyter_webdav_service'],
                                'environment': webdav_service_dict
                            }
                        ]
```

You also need to extend the Jupyter single user server to run a webdav sidecar container

```
c.KubeSpawner.singleuser_extra_containers = [
        {
            "name": "webdav",
            "image": "httpd:latest",
            "ports": [
                {
                    "containerPort": 8081,
                    "protocol": "TCP"
                }
            ],
            "env" : [
                {
                    "name": "NBVIEWER_LOCALFILES",
                    "value": "/opt/app-root/src/public_notebooks"
                },
                {
                    "name": "NBVIEWER_TEMPLATES",
                    "value": "/opt/app-root/src"
                },
                {
                    "name": "NBVIEWER_PORT",
                    "value": "9090"
                },
                {
                    "name": "JUPYTERHUB_SERVICE_PREFIX",
                    "value": "/user/{username}/public/"
                },
                {
                    "name": "CACHE_EXPIRY_MIN",
                    "value": "30"
                },
                {
                    "name": "CACHE_EXPIRY_MAX",
                    "value": "60"
                },
                {
                    "name": "NO_CACHE",
                    "value": "true"
                }
            ],
            "volumeMounts": [
                {
                    "mountPath": "/opt/app-root/src",
                    "name": "data"
                }
            ]
        }
    ]
```

The `webdav` image is based on https://github.com/afeiszli/webdav-quickstart which is designed to be built and run on top of OpenShift. To get the image available, run

```
oc apply -f https://raw.githubusercontent.com/afeiszli/webdav-quickstart/master/images.json
```

## Install the extension

```
[ -z "${PUBLISH_EXTENSION_VERSION}" ] && PUBLISH_EXTENSION_VERSION=master

jupyter nbextension install --sys-prefix https://raw.githubusercontent.com/vpavlin/jupyter-publish-extension/${PUBLISH_EXTENSION_VERSION}/publish.js

jupyter nbextension enable --sys-prefix publish
```

