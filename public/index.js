const canvas = $("#canvas");
const clear = $("#clear");
const submit = $("#submit");
const signature = $(".signature");
const ctx = canvas[0].getContext("2d");
//credit to Joe for help with canvas
let position = { x: 0, y: 0 };

function setPosition(e) {
    position.x = e.offsetX;
    position.y = e.offsetY;
}

function draw(e) {
    if (e.buttons !== 1) return;
    ctx.beginPath();

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    ctx.moveTo(position.x, position.y);
    setPosition(e);
    ctx.lineTo(position.x, position.y);
    ctx.stroke();
}

function clearCanvas() {
    canvas[0].width = canvas[0].width;
}

canvas.on("mousemove", draw);
canvas.on("mousedown", setPosition);
canvas.on("mouseup", setPosition);
clear.on("click", clearCanvas);
submit.on("click", function() {
    $(signature).val(canvas[0].toDataURL());
});
