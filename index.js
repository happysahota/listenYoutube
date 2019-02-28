const readline = require('readline');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const sanitize = require("sanitize-filename");
var request = require('request');
var cheerio = require('cheerio');


const url = 'https://www.youtube.com/watch?v=w-7RQ46RgxU&list=PL4cUxeGkcC9gcy9lrvMJ75z9maRw4byYp';

// youtube video ids array
let videoIdsArray = [];
let title = '';
let counter = videoIdsArray.length - 1;

function fetchVideosList() {
    request.get(url, function (er, res, body) {
        if (er) {
            console.error("Error: ", er);
            throw er;
        } else {
            var videoIdsArray = [];

            var $ = cheerio.load(body);
            $("li.yt-uix-scroller-scroll-unit a").each(function (link) {
                // console.log($(this).attr('href'));
                var vidUrl = 'https://www.youtube.com' + $(this).attr('href').replace(/&amp;/g, '&');

                videoIdsArray.push(vidUrl);
            });

            if(!videoIdsArray.length) {
                videoIdsArray.push(url);

                // Start Download.
                initDownloader();
            }
        }

    });

    
}

function initDownloader() {

    let id = videoIdsArray[counter];
    // console.log(id,' = ',counter);
    counter--;

    let stream = ytdl(id, {
        quality: 'highestaudio',
    });

    ytdl.getInfo(id, function (e, i) {
        console.log('-------> ', i.title);
        title = sanitize(i.title);
        id = i.video_id;
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
                    initDownloader();
                }
            });
    }
}

// Support to youtube playlist added.
fetchVideosList();