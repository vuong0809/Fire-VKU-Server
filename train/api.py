import socketio
import train
import json
import os
import shutil

io = socketio.Client()

url = 'http://localhost:8000'

io.connect(url)

@io.on('dataset')
def on_message(msg):
    dataset = os.listdir('./data')
    io.emit('dataset',dataset);

@io.on('training')
def on_message(msg):
    io.emit('TrainingStart','')
    train.run(imgsz=int(msg['img']), batch_size = int(msg['batch']) ,epochs = int(msg['epoch']),data=msg['data'], weights='yolov5s.pt', adam=True)
    mydir = os.path.dirname(os.path.abspath('../train'))+'/datasets'
    try:
        shutil.rmtree(mydir)
    except OSError as e:
        print("Error: %s - %s." % (e.filename, e.strerror))


    io.emit('TrainingDone','')

@io.on('CreateTrainingFile')
def on_message(msg):

    fp = open('./data/'+msg['dataset']+'.yaml', 'w')
    fp.write('# parent\n# ├── yolov5\n# └── datasets\n#     └── coco  ← downloads here\n')
    fp.write('path: ../datasets/'+msg['path']+' # dataset root dir\n')
    fp.write('train: '+msg['train']+' # train images (relative to path) 128 images\n')
    fp.write('val: '+msg['val']+' # val images (relative to path) 128 images\n')
    fp.write('test:  # test images (optional)\n')
    fp.write('\n# Classes\n')
    fp.write('nc: '+str(msg['nc'])+'\n')
    fp.write('names: '+msg['names']+'\n')
    fp.write('# Download script/URL (optional)\n')
    fp.write('download: '+url+'/datasets/'+msg['dataset'])
    fp.close()

    dataset = os.listdir('./data')
    io.emit('dataset',dataset);