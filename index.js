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


var fileReadStream, fileWriteStream;


var fileChecked = false;

var newIdsArray = [];


function fetchPlaylist() {
    // you nee to put the url of play list not of the page where playlist getting played.
    request.get("https://www.youtube.com/playlist?list=PLunlFzx6l6pLuTFWZAFdiBhm_S0Zk6oFl", function (er, res, body) {
        if (er) {
            console.error("Error: ", er);
            throw er;
        } else {
            
            var $ = cheerio.load(body);
            playlistDirectory = ($('h1.pl-header-title').text()).trim();
            // fs.writeFileSync("ytRowData.html", $("body").html());
            // console.log("->",playlistDirectory,"<-");return;

            $(".pl-video-title a.pl-video-title-link").each(function (link) {
                url_string = 'https://www.youtube.com' + $(this).attr('href').replace(/&amp;/g, '&');
                url_parts = url.parse(url_string, true);
                
                newIdsArray.push(url_parts.query.v);
            });
            
            // console.log(newIdsArray);
            //Check if song already downloaded in past.
            checkLog();

        }
    });
}


//Check if already downloaded
function checkLog(vid, callback) {

    let videoLogs = [];
    let filePath = `${__dirname}/${downloadsFolder}/${logFileName}`;

    if (!fileChecked) {
        fileChecked = true;
        fs.open(filePath, 'a+', (err, fo) => {

            if (err) {
                return console.log("Errr: ", err);
            }

        });

    }

    //File streams start
    fileReadStream = fs.createReadStream(filePath, { encoding: 'utf8', flag: 'r' });
    fileWriteStream = fs.createWriteStream(filePath, { flags: 'a' });

    fileReadStream.on('data', (data) => {

        dataExists = true;
        videoLogs = data.split('\r\n');

        newIdsArray.forEach((val, i)=>{
            if (videoLogs.indexOf(val) !== -1) {

                console.warn(val, " : Already downloaded in the past.");

                //remove the item already downloaded in the past
                newIdsArray.splice(i, 1);
    
            } else {
                console.info(val, " : New video.");
            }
        });       

    });

    fileReadStream.on('end', () => {

        //initiating Downloads
        // console.log("=================>>>>>>>>>> Init called");
        init();
        
    });

}


function init() {

    var id = newIdsArray.pop();

    if (!fs.existsSync(`${__dirname}/${downloadsFolder}/${playlistDirectory}`)) {
        fs.mkdirSync(`${__dirname}/${downloadsFolder}/${playlistDirectory}`);
    }

    let stream = ytdl(id, {
        quality: 'highestaudio',
    });
    
    ytdl.getInfo(id, function (e, i) {
        // fs.writeFileSync("ytdl.getInfo.json", JSON.stringify(i));
        console.log('Downloading -------> ', i.player_response.videoDetails.title);
        title = sanitize(i.player_response.videoDetails.title);
        // id = i.player_response.videoDetails.videoId;
        
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
                
                fileWriteStream.write(id + '\r\n');
                if(newIdsArray.length) {
                    // console.log("=================>>>>>>>>>> Init Recalled");
                    init();
                }
            }).on('error', (err, stdout, stderr) => {
                console.log("ffmpeg err:\n" + err);
                console.log("ffmpeg stdout:\n" + stdout);
                console.log("ffmpeg stderr:\n" + stderr);
            });
    }
}

fetchPlaylist();
