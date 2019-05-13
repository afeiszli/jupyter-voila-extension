# JupyterHub WebDav Extension

This extension and service allow you to use voila with your notebooks in JupyterHub

Requirements:

* Using KubeSpawner (i.e. running on top of Kubernetes/OpenShift)
* Installing this repo through pip
* Installing & enabling voila in your notebook container
* Edit your `jupyterhub_config.py`

## Install and run the voila service
Add git URL to your `requirements.txt` for JupyterHub

```
git+https://github.com/afeiszli/jupyter-voila-extension.git
```

And add the following to your `jupyterhub_config.py` to enable the service to run

```
import uuid
c.ConfigurableHTTPProxy.auth_token = str(uuid.uuid4())
voila_service_dict = {
                        'PROXY_TOKEN': c.ConfigurableHTTPProxy.auth_token,
                        'PROXY_API_URL': 'http://%s:%d/' % ("127.0.0.1", 8082)
                    }
voila_service_dict.update(os.environ)
c.JupyterHub.services = [
                            {
                                'name': 'voila',
                                'command': ['bash', '-c', 'jupyter_voila_service'],
                                'environment': voila_service_dict
                            }
                        ]
```

You also need to extend the Jupyter single user server to run a voila sidecar container

```
c.KubeSpawner.singleuser_extra_containers = [
        {
            "name": "voila",
            "image": "openshift/httpd:latest",
            "ports": [
                {
                    "containerPort": 8081,
                    "protocol": "TCP"
                }
            ],
            "env" : [
                {
                    "name": "WEBDAV_PORT",
                    "value": "9090"
                },
		{
            	    "name": "WEBDAV_AUTHENTICATION_REALM",
                    "value": "chaosmonkey/httpd-voila"
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
                    "name": "volume-dh6g7"
                },
                {
		    "mountPath": "/opt/app-root/secrets/voila/",
                    "name": "volume-92dkl"
 		},
		{
            	    "mountPath": "/etc/httpd/conf.d/90-voila.conf",
                    "name": "volume-pv4s4",
                    "subPath": "90-voila.conf"
		}
            ]
        }
    ]
```

The `voila` image is based on https://github.com/afeiszli/voila-quickstart which is designed to be built and run on top of OpenShift. To get the image available, run

```
oc apply -f https://raw.githubusercontent.com/afeiszli/voila-quickstart/master/images.json
```

