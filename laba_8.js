'use strict';
var request = require('sync-request');
var fs = require('fs');
var express = require('express'); 
var app = express(); 

//https://api.meetup.com/find/upcoming_events?key=10467d721e56765f56726e64326a5331&sign=true&photo-host=public&end_date_range=2018-12-31T00:00:00&text=big%data&radius=100&lon=-122.42&lat=37.78&page=1000

var meetup = 
{
	url: 'https://api.meetup.com/find/upcoming_events',
	method: 'GET',
	name: 'meetup',
	qs: 
	{
		key: 'd16134f745101e236b2d4124591130',
		text: 'data',
		start_date_range: '2018-06-20T00:00:00',
		end_date_range: '2018-07-10T00:00:00',
		radius: '2',
		lon: '-122.42',
		lat: '37.78',
		page: '1000'
	}
};

//https://www.eventbriteapi.com/v3/events/search/?location.longitude=-122.42&q=big+data&token=TD4KJTXK4VUCSJNXQ3X2&start_date.range_end=2018-12-31T00%3A00%3A00&location.latitude=37.78&location.within=100km

var eventbrite = 
{
	url: 'https://www.eventbriteapi.com/v3/events/search',
	method: 'GET',
	name: 'eventbrite',
	qs: 
	{
		token: 'MZNSJE2ECGA5HU6E2WHR',
		q: 'data',
		'start_date.range_start': '2018-06-20T00:00:00',
		'start_date.range_end': '2018-07-10T00:00:00',
		'location.within': '2km',
		'location.longitude': '-122.42',
		'location.latitude': '37.78',
		page: 1
	}
};

//console.log(eventbrite);

// var req1 = request(eventbrite.method, eventbrite.url, eventbrite)
// var result1 = JSON.parse(req1.getBody('utf8'));
//console.log((result1.events[0]));
// fs.writeFileSync('eventbrite.json', JSON.stringify(result1, '', 4));

// var req2 = request(meetup.method, meetup.url, meetup);
// var result2 = JSON.parse(req2.getBody('utf8'));
//console.log((result2.events[0]));
// fs.writeFileSync('meetup.json', JSON.stringify(result2, '', 4));

function getJSON(data)
{
	var req = request(data.method, data.url, data);
	var result = JSON.parse(req.getBody('utf8'));
	console.log('Загружено: '+ result.events.length + ' событий, ' + data.name);
	return result.events;
}



var json_eventbrite = getJSON(eventbrite);
var json_meetup = getJSON(meetup);

// fs.writeFileSync('meetup.json', JSON.stringify(json_meetup, '', 4)); //создаем файлы
// fs.writeFileSync('eventbrite.json', JSON.stringify(json_eventbrite, '', 4));

// var json_meetup = JSON.parse(fs.readFileSync('meetup.json', 'utf8'));
// var json_eventbrite = JSON.parse(fs.readFileSync('eventbrite.json', 'utf8'));


function delete_duplicate(meetup_json, eventbrite_json) 
{
	var count = 0;

	for (var i = 0; i < meetup_json.length; i++) 
	{
		for (var j = 0; j < eventbrite_json.length; j++) 
		{
			if ( meetup_json[i].name == eventbrite_json[j].name.text ) 
			{
				eventbrite_json.splice(j, 1);
				count++;
			}
		}
	}
	console.log('Удалено дубликатов: ' + count);
}
delete_duplicate(json_meetup, json_eventbrite); //не забыть добавить .events

function aggregate(json_meetup, json_eventbrite) 
{
		var merged_array = [];

		for (var i = 0; i < json_meetup.length; i++) 
		{		if (json_meetup[i].local_date && json_meetup[i].local_time) 
			{ 
			var item = 
				{
				'name': json_meetup[i].name,
				'link': json_meetup[i].link,
				'date_time': json_meetup[i].local_date + 'T' + json_meetup[i].local_time + ':00',
				'description': json_meetup[i].description
				}
			merged_array = merged_array.concat(item);
			}

		}
		for (var i = 0; i < json_eventbrite.length; i++) 
		{
			var item = 
			{
				'name': json_eventbrite[i].name.text,
				'link': json_eventbrite[i].url,
				'date_time': json_eventbrite[i].start.local,
				'description': json_eventbrite[i].description.html
			}

			merged_array = merged_array.concat(item);

		}
		return merged_array;

		console.log(merged_array.length)
}

var merged_array = aggregate(json_meetup, json_eventbrite);

merged_array.sort(function(event1, event2) {
	return Date.parse(event1.date_time) - Date.parse(event2.date_time);
});

console.log(merged_array);

function html() 
{
	

	for (var i = 0; i < merged_array.length; i++) 
	{
		merged_array[i].date = new Date(Date.parse(merged_array[i].date_time)).toLocaleString("en-US", 
			{
				year: 'numeric', month: 'long', day: 'numeric'});
	}

	var currentDate = merged_array[0].date;


	fs.writeFileSync('out.html', 
		'<!DOCTYPE html>' + 
		'<html lang="en">' + 
		'<head><meta charset="UTF-8"><title>Meetups</title>' +
		'<link rel="stylesheet" href="/public/css/main.css">' + 
		'</head>' + 
		'<body>' +
		'<div class="wrap"><h1>Все встречи в Сан Франциско</h1><h2 class="date">' + currentDate + '</h2>');

	//цикл по сортированному массиву
	for (var i = 0; i < merged_array.length; i++) {
		//если дата i-го элемента массива совпадает с текущей датой, то выводим информацию о событиии в html
		if (merged_array[i].date == currentDate) {
			//Используем уже не writeFileSync, а appendFileSync, потому что надо файл не создавать заново, а дописывать в него информацию, для этого используется appendFileSync
			fs.appendFileSync('out.html',
				'<h3 class="title"><a href=' + merged_array[i].link + ' target=blank>' + merged_array[i].name + '</a></h2><br>' + 
				'<div class="date_time"><strong>Date: </strong> ' + merged_array[i].date + '</div><br>' +
				'<div class="desc"><strong>Description:</strong> ' + merged_array[i].description + '</div><br><br>'
			)
		} else { //Когда в наш цикл попадает событие с датой, которая отличается от currentDate, то мы присваиваем это новое значение даты в currentDate и выводим в html новую дату.
			currentDate = merged_array[i].date;
			fs.appendFileSync('out.html', '<h2 class="date">' + currentDate + '</h2>');
		}
		
	}

	//любой html файл заканчивается такими строками.
	fs.appendFileSync('out.html', '</body></html>');
	console.log('html файл создан. Добавлено событий: ' + merged_array.length);
}

// Вызов функции, если кто забыл)
html();


/*Настройки для сервера - чтобы использовать надо установить библиотеку express, через npm install express в папке проекта через консоль, как делали в самом начале.
Если все правильно, то она должна добавиться в файле package.json. На всякий случай сохраните ваши файлы.
!!Не забудьте подключить ее в шапке программы!!*/

// папка, где будут лежать картинки, файлы css
app.use('/public', express.static('public'));

//обозначаем, что главная страница будет у нас отображать только что созданную out.html
app.get('/', function(req, res) {
	res.sendFile(__dirname + "/out.html");
});

//запускаем локальный сервер http://127.0.0.1:3000, чтобы посмотреть результат надо перейти по этому адресу в браузере
app.listen(3000); 
console.log('Локальный сервер запущен: http://127.0.0.1:3000/');


