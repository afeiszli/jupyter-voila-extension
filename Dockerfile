FROM jupyterhub-img:latest

RUN pip install git+https://github.com/afeiszli/jupyter-voila-extension.git
