# Setup

## Environment
```
python -m venv --system-site-packages .\venv
or 
py -m venv --system-site-packages .\venv
```
## Activate environment
```
.\venv\Scripts\activate
pip install --upgrade pip
```
## Exit the virtual environment
```
deactivate
```

## Install
```
pip install -qr requirements.txt
pip list
```
# Train
```
python3 train.py --img 320 --batch 1 --epochs 3 --data coco128.yaml --weights yolov5s.pt --cache
```
# Test
# Export
```
python3 export.py --weights yolov5s.pt 
```