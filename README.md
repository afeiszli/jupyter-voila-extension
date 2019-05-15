# JupyterHub Voila Extension

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

### NOTE: You must get Voila running on your notebook, on port 8866, on your own; this does not manage the notebook, only routing to the notebook.
