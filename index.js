const readline = require('readline');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const sanitize = require("sanitize-filename");

var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var url = require('url');


var url_string = '';
var url_parts = '';

let title = '';

var downloadsFolder = "downloads";
var logFileName = 'youtube.txt';
var playlistDirectory = "unamed";


function fetchPlaylist() {
    request.get("https://www.youtube.com/watch?v=5O3ls3RTeuk&list=PLunlFzx6l6pLS4hwMgS__63VfpNOIKwwa", function (er, res, body) {
        if (er) {
            console.error("Error: ", er);
            throw er;
        } else {
            
            var $ = cheerio.load(body);
            playlistDirectory = $('h3.playlist-title a').text();
            $("li.yt-uix-scroller-scroll-unit a").each(function (link) {

                url_string = 'https://www.youtube.com' + $(this).attr('href').replace(/&amp;/g, '&');
                url_parts = url.parse(url_string, true);

                //Check if song already downloaded in past.
                checkLog(url_parts.query.v, (vid) => {

                    console.log("Starting download of ", vid);
                    init(vid);

                });
            });

        }
    });
}


//Check if already downloaded
function checkLog(vid, callback) {

    let videoLogs = [];
    let filePath = `${__dirname}/${downloadsFolder}/${logFileName}`;
    let dataExists = false;


    fs.open(filePath, 'a+', (err, fo) => {

        if (err) {
            return console.log("Errr: ", err);
        }

        //File streams start
        var fileReadStream = fs.createReadStream(filePath, { encoding: 'utf8', flag: 'r' });
        var fileWriteStream = fs.createWriteStream(filePath, {flags:'a'});
        
        fileReadStream.on('data', (data) => {

            dataExists = true;
            videoLogs = data.split('\r\n');
            if(videoLogs.indexOf(vid) === -1) {

                callback(vid);                
                fileWriteStream.write(vid+'\r\n');

            } else {
                console.warn(vid, " : Already downloaded in the past.");
            }

        });

        fileReadStream.on('end', ()=>{
            if(!dataExists) {

                callback(vid);            
                fileWriteStream.write(vid+'\r\n');

            }            
        });



    });
    
}


function init(id) {

    if (!fs.existsSync(`${__dirname}/${downloadsFolder}/${playlistDirectory}`)) {
        fs.mkdirSync(`${__dirname}/${downloadsFolder}/${playlistDirectory}`);
    }

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
            .save(`${__dirname}/${downloadsFolder}/${playlistDirectory}/${title}_${id}.mp3`)
            .on('progress', (p) => {
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`${p.targetSize}kb downloaded`);
            })
            .on('end', () => {
                // console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s, Next id: ${counter}`);
                console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
            });
    }
}

fetchPlaylist();
