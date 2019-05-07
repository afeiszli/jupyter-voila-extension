# JupyterHub Publish Extension

This extension and service allow you to publish and share your notebooks in JupyterHub

Requirements:

* Using KubeSpawner (i.e. running on top of Kubernetes/OpenShift)
* Installing this repo through pip
* Installing & enabling `publish.js` as nbextension
* Edit your `jupyterhub_config.py`

All bellow is done automatically if you use Open Data Hub deployment of JupyterHub (see https://gitlab.com/opendatahub/jupyterhub-ansible)

## Install and run the publish service
Add git URL to your `requirements.txt` for JupyterHub

```
git+https://github.com/vpavlin/jupyter-publish-extension.git
```

And add the following to your `jupyterhub_config.py` to enable the service to run

```
import uuid
c.ConfigurableHTTPProxy.auth_token = str(uuid.uuid4())
public_service_dict = {
                        'PROXY_TOKEN': c.ConfigurableHTTPProxy.auth_token,
                        'PROXY_API_URL': 'http://%s:%d/' % ("127.0.0.1", 8082)
                    }
public_service_dict.update(os.environ)
c.JupyterHub.services = [
                            {
                                'name': 'public',
                                'command': ['bash', '-c', 'jupyter_publish_service'],
                                'environment': public_service_dict
                            }
                        ]
```

You also need to extend the Jupyter single user server to run a nbviewer sidecar container

```
c.KubeSpawner.singleuser_extra_containers = [
        {
            "name": "nbviewer",
            "image": "nbviewer:latest",
            "ports": [
                {
                    "containerPort": 9090,
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

The `nbviewer` image is based on https://github.com/vpavlin/nbviewer-quickstart which is designed to be built and run on top of OpenShift. To get the image available, run

```
oc apply -f https://raw.githubusercontent.com/vpavlin/nbviewer-quickstart/master/images.json
```

## Install the extension

```
[ -z "${PUBLISH_EXTENSION_VERSION}" ] && PUBLISH_EXTENSION_VERSION=master

jupyter nbextension install --sys-prefix https://raw.githubusercontent.com/vpavlin/jupyter-publish-extension/${PUBLISH_EXTENSION_VERSION}/publish.js

jupyter nbextension enable --sys-prefix publish
```

