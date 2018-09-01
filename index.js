const readline = require('readline');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const sanitize = require("sanitize-filename");


// youtube video ids array
let ids = ['1W5BA0lDVLM'];
let title = '';
let counter = ids.length - 1;

function init() {

    let id = ids[counter];
    // console.log(id,' = ',counter);
    counter--;

    let stream = ytdl(id, {
        quality: 'highestaudio',
    });

    ytdl.getInfo(id, function (e, i) {
        console.log('-------> ', i.title);
        title = sanitize(i.title);
        initiateDownload();
    });

    function initiateDownload() {
        let start = Date.now();
        ffmpeg(stream)
            .audioBitrate(320)
            .save(`${__dirname}/downloads/${title}_${id}.mp3`)
            // .save(`${__dirname}/downloads/${id}.mp3`)
            .on('progress', (p) => {
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`${p.targetSize}kb downloaded`);
            })
            .on('end', () => {
                console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s, Next id: ${counter}`);
                if (counter >= 0) {
                    init();
                }
            });
    }
}

init();