const canvas = document.getElementById('mycanvas');
const context = canvas.getContext('2d');
var image = new Image();
image.src = "https://live.staticflickr.com/47/150654741_ae02588670_b.jpg";
drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);