#!/usr/bin/env python

import re
import os

from setuptools import setup, find_packages


def _get_requirements(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path) as f:
            packages = f.read().splitlines()
    except (IOError, OSError) as ex:
        raise RuntimeError("Can't open file with requirements: %s", repr(ex))
    packages = (p.strip() for p in packages if not re.match("^\s*#", p))
    packages = list(filter(None, packages))
    return packages


def _install_requirements():
    requirements = _get_requirements('requirements.txt')
    return requirements

setup(
    name='publish_service',
    version='0.0.1',
    description='JupyterHub service to add a public route for notebook publishing',
    author='Red Hat, Inc.',
    author_email='vasek@redhat.com',
    url='https://github.com/vpavlin/jupyter-publish-extension',
    license="GPL3",
    entry_points={
        'console_scripts': ['jupyter_publish_service=publish_service.publish_service:run'],
    },
    packages=find_packages(),
    install_requires=_install_requirements()
)