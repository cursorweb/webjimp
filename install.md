Don't forget to make a `venv`!

```sh
python -m pip install -r requirements.txt
python -m pip install 'git+https://github.com/facebookresearch/sam2.git'

mkdir -p checkpoints
wget -P checkpoints https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_tiny.pt
```

You can also manually try to download the files as well.
To try out jupyter, run:
```sh
python -m pip install jupyter
```

To run backend:
```
uvicorn backend:app --reload
```