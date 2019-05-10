var request = require('request');
var cheerio = require('cheerio');

request.get("https://www.youtube.com/watch?v=w-7RQ46RgxU&list=PL4cUxeGkcC9gcy9lrvMJ75z9maRw4byYp", function (er, res, body) {
    if (er) {
        console.error("Error: ", er);
        throw er;
    } else {
        var videoList = [];

        var $ = cheerio.load(body);
        $("li.yt-uix-scroller-scroll-unit a").each(function(link){
            // console.log($(this).attr('href'));
            var url = 'https://www.youtube.com' + $(this).attr('href').replace(/&amp;/g, '&');

            videoList.push(url);
        });
        
        console.log(videoList);
    }

});