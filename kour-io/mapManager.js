function loadScript(url, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = callback;
    script.onload = callback;
    document.head.appendChild(script);
}
function processCustomMapImage() {
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    fileInput.onchange = function () {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = 128;
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/pica/9.0.1/pica.min.js', function () {
                    pica().resize(img, canvas, {
                        unsharpAmount: 100,
                        unsharpRadius: 0.6,
                        unsharpThreshold: 2
                    })
                        .then(result => pica().toBlob(result, 'image/jpeg', 0.90))
                        .then(blob => sendToUnity(blob))
                        .catch(error => console.error('Error resizing image:', error));
                });
            };
            img.onerror = () => {
                console.error('Could not load image.');
            };
            img.src = URL.createObjectURL(file);
            document.body.removeChild(fileInput);
        }
    };
    fileInput.click();
}
function sendToUnity(blob) {
    const reader = new FileReader();
    reader.onload = function () {
        const dataUrl = reader.result;
        unityInstanceWrapper.sendMessage('ImageHandler', 'ReceiveImage', dataUrl);
    };
    reader.readAsDataURL(blob);
}
