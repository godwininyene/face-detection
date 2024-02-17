
const video = document.querySelector('#video');
Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  ]).then(startWebcam).then(faceRecognition);

  

//   startWebcam()
function startWebcam(){
    navigator.mediaDevices.getUserMedia({
        "video":true,
        audio:false
    }).then(stream =>{
        video.srcObject= stream;
    }).catch(error =>{
        console.error(error)
    })
}

function getLabeledFaceDescriptions(){
    const labels = ['Godwin'];

   return Promise.all(
    labels.map(async(label)=>{
        const descriptions = [];

        for(var i = 1; i < labels.length; i ++){
            const image = await faceapi.fetchImage(`/labels/${label}/${i}.png `)
            const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().faceDescriptor();
            descriptions.push(detections.descriptor)
        }

        return new faceapi.LabeledFaceDescriptors(label, descriptions)

        
    })
   )
}

async function faceRecognition(){
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
    video.addEventListener('play', ()=>{
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = {width:video.width, height:video.height};

        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async()=>{
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

            const results = resizedDetections.map((d)=>{
                return faceMatcher.findBestMatch(d.descriptor)
            });

            results.forEach((result, i)=>{
                const box = resizedDetections[i].detection.box;
                const drawBox = new faceapi.draw.DrawBox(box, {label:result});
                drawBox.draw(canvas)
            })
        }, 100)
    })
}

