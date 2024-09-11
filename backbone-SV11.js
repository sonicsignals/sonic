    hoje = new Date();

    dia = hoje.getDate() + 0;

    dias = hoje.getDay() + 1;

    mes = hoje.getMonth() + 1;

    ano = hoje.getYear();

    var listBestPairTimes = [];
    var listPairs = [
          "EUR_USD",
"GBP_AUD",
"EUR_AUD",
"EUR_JPY",
"GBP_CAD",
"USD_JPY",
"EUR_CHF",
"AUD_CAD",
"GBP_CHF",
"EUR_GBP",
"AUD_CHF",
"CAD_JPY",
"GBP_JPY",
"EUR_CAD",
"AUD_JPY",
"GBP_NZD",
    ];

    var percentageMin = 100;
    var percentageMax = 100;
    var candleTime = 'M5';
    var daysAnalyse = 20;
    var martingales = 0;
    var orderType = 'DOWN';
    var timeInit = 2;
    var timeEnd = 18;

    var requestNumber = 0;
    //First action when clicking on PROCESS DATA button
    function getHistoric() {
        $('body').css('cursor', 'progress');
        listBestPairTimes = [];
        getParameter();
        //I check if the Asset field is in All Assets if not it searches for the selected asset
        if (cbAtivo == 0) {
            requestNumber = listPairs.length;
        } else {
            listPairs = [cbAtivo];
            requestNumber = listPairs.length;
        }

        var count = CalculateCountCandles();
        if (count > 50000) {
            alert('The number of candles exceeds 50,000, please decrease the number of days analyzed');
            return;
        }

        for (var i = 0; i < listPairs.length; i++) {
            var currentPair = listPairs[i];
            callHistoricData(currentPair, count, cbAtivo);
        }
    }

    function getParameter() {
        percentageMin = 100;
        percentageMax = 100;
        candleTime = $('#selCandleTime').val();
        daysAnalyse = $('#selDays').val();
        martingales = $('#selMartingales').val();
        orderType = $('#selOrderType').val();
        timeInit = $('#selTimeInit').val();
        timeEnd = $('#selTimeEnd').val();
        cbAtivo = $('#cbAtivo').val();
    }

function CalculateCountCandles() {
        var minutes = 15; // DEFAULT FOR M15
        switch (candleTime) {
            case 'M2':
                minutes = 2;
                break;
                case 'M2':
                minutes = 2;
                break;
            case 'M10':
                minutes = 10;
                break;
            case 'M15':
                minutes = 15;
                break;
            case 'M30':
                minutes = 30;
                break;
            case 'H1':
                minutes = 60;
                break;
            case 'H2':
                minutes = 120;
                break;
            case 'H4':
                minutes = 240;
                break;
        }


        var count = 60 / minutes;
        count = 24 * count;
        count = count * daysAnalyse;
        return count;
    }

    function callHistoricData(pair, count, cbAtivo) {
        var count_i = 0;
        if (cbAtivo == 0) {
            //var urlHist = "https://api-fxtrade.oanda.com/v1/candles?instrument="+pair+"&start=1565395200&end=1569283200&granularity=M1";
            //var urlHist = "https://api-fxtrade.oanda.com/v1/candles?instrument="+pair+"&start="+startDate+"&end="+endDate+"&granularity="+candleTime+"&candleFormat=midpoint";
            //var urlHist = "https://api-fxpractice.oanda.com/v3/instruments/"+pair+"/candles?from="+startDate+"&to="+endDate+"&granularity="+candleTime+"";
            var urlHist =
                'https://api-fxpractice.oanda.com/v3/instruments/' +
                pair +

                '/candles?granularity=' +
                candleTime +
                '&count=' +
                count;
            $.ajax({
                url: urlHist,
                headers: {
                    Authorization: 'Bearer eb2326208921b413a87728832f191f03-d9be68b74884f7d3107b9f05ca305319',
                },
                type: 'GET',
                success: function (result) {
                    CalculateHistoric(result);
                },
                error: function (error) {
                    ErrorHistoric(error);
                },
            });
        } else {
            if (count_i == 0) {
                //(cbAtivo == pair && count_i == 0 ){
                //alert(cbAtivo);
                //count_i ++;
                var urlHist =
                    'https://api-fxpractice.oanda.com/v3/instruments/' +
                    pair +
                    '/candles?granularity=' +
                    candleTime +
                    '&count=' +
                    count;
                $.ajax({
                    url: urlHist,
                    headers: {
                        Authorization:
                            'Bearer  eb2326208921b413a87728832f191f03-d9be68b74884f7d3107b9f05ca305319',
                    },
                    type: 'GET',
                    success: function (result) {
                        CalculateHistoric(result);
                    },
                    error: function (error) {
                        ErrorHistoric(error);
                    },
                });
            }
        }
    }
    function CalculateHistoric(result) {
        var candles = result.candles;
        var candlesResult = [];
        for (var i = 0; i < candles.length; i++) {
            var candle = candles[i];

            var item = new Object();
            item.resultValue = candle.mid.o - candle.mid.c;
            item.date = ConvertDate(candle.time);
            item.result = GetStringResult(item.resultValue);
            item.percentDif = (item.resultValue * 100) / candle.mid.o;
            if (item.result === orderType) {
                item.win = true;
            } else {
                item.win = false;
            }

            //if(CheckTime(item.date)){

            var arrayTime = item.date.time.split(':');

            if (parseInt(arrayTime[0]) < parseInt(timeInit) || parseInt(arrayTime[0]) > parseInt(timeEnd)) {
                continue;
            }
            candlesResult.push(item);
        }
        var martinGaleResult = candlesResult;
        if (martingales > 0) {
            martinGaleResult = [];
            for (var i = 0; i < candlesResult.length; i++) {
                var candle = candlesResult[i];
                candle.nextCandles = GetNextMartingales(candlesResult, i);
                candle.win = candle.win === false ? GetMartingaleResult(candle) : true;
                martinGaleResult.push(candle);
            }
        }

        var timeGroupedCandles = Array.from(new Set(martinGaleResult.map((s) => s.date.time))).map((time) => {
            return {
                time: time,
                candles: martinGaleResult.filter((s) => s.date.time === time),
                pair: result.instrument,
            };
        });

        for (var i = 0; i < timeGroupedCandles.length; i++) {
            var currentGroup = timeGroupedCandles[i];

            currentGroup.winrate = 0;
            currentGroup.averageTickDif = 0;
            for (var z = 0; z < currentGroup.candles.length; z++) {
                var candle = currentGroup.candles[z];

                if (candle.win == true) {
                    currentGroup.winrate++;
                    currentGroup.averageTickDif += item.percentDif;
                }
            }
            currentGroup.averageTickDif = currentGroup.averageTickDif / currentGroup.winrate;

            currentGroup.winrate = (currentGroup.winrate * 100) / currentGroup.candles.length;

            if (currentGroup.winrate >= percentageMin && currentGroup.winrate <= percentageMax) {
                listBestPairTimes.push(currentGroup);
                continue;
            }
        }
        requestNumber--;
        if (requestNumber == 0) {
            DownloadTxt();
        }
    }

    function CheckTime(date) {
        var minDate = new Date();
        return true;
    }

    function GetMartingaleResult(candle) {
        var anyWin = candle.nextCandles.find((s) => s.win === true);

        return anyWin != undefined && anyWin != null > 0 ? true : false;
    }

    function GetNextMartingales(listCandles, index) {
        var nextCandles = [];
        var candle = listCandles[index];
        if (martingales > 0 && parseInt(index) + parseInt(martingales) < listCandles.length) {
            for (var i = 1; i <= martingales; i++) {
                var nextCandle = listCandles[index + i];
                nextCandles.push(nextCandle);
            }
            return nextCandles;
        } else {
            return nextCandles;
        }
    }
function getLocalTime() {
    const now = new Date(); // Get current date and time
    return now.toLocaleTimeString(); // Convert to local time string
}
function getLocalDate() {
    const now = new Date(); // Get current date and time
    return now.toLocaleDateString(); // Convert to local date string
}

			function DownloadTxt() {
    if (listBestPairTimes.length <= 0) {
        alert('No signal found for the selected win-rate and time range.');
        return;
    }
    listBestPairTimes.sort((a, b) => (a.time > b.time) ? 1 : -1);
    var listNumber = listBestPairTimes.length / 80;
    var i = 0;
	var stringList2 = 

//### END ALGORITHM CODE --------------------------------------------------###//


"\n--SONIC TRADER -- ALFA SV-11 For QUOTEX"+ 
"\nAdmin: https://t.me/sonicfuturetrader"+
"\nMain Channel: https://t.me/+AFHxrW0CADxmYTg1"+
"\nDiscuss Group: https://t.me/sonic_public_discuss"+
"\n ________________________________________________\r"+
"\nSignal Time Zone: UTC +6" +
"\nCandle Time Frame: "+' '+candleTime+
"\nSignal Directions :" + " "+orderType+
"\nTake MTG : "+"0/1"+
"\nLocal Time: " +  getLocalTime()+
"\nSignal Date: "+ getLocalDate() + 
"\n ________________________________________________\r"+
"\nCALL MEANS = UP 🔼"+
"\nPUT MEANS= DOWN🔽"+
"\n ________________________________________________\r"+
"\n\n📊HOW USE THIS SIGNALS ?"+
"\n🔵MAX ONE MTG"+
"\n🔵AVOID IF TRENDE IS AGAINST THE SIGNAL."+
"\n🔵AVOID IF PREVIOUS CANDLE DOJI."+
"\n🔵AVOID IF PREVIOUS CANDLE EXTRA ORDINAY BIG FROM PREVIOUS CANDLE."+
"\n🔵AVOID IF PREVIOUS CANDLE WICK 3X BIG FROM BODY  ."+
"\n🔵AVOID IF THE PREVIOUS (6-8) CANDLES ARE OF SAME COLOR BUT SIGNAL IS OPPOSITE."+
"\n\n\n\n ________________________";


		for(var x = 0; x < listNumber; x++){
		var index = 1;

        for (; i < listBestPairTimes.length; i++) {
            var candle = listBestPairTimes[i];
            var arrayTime = candle.time.split(':');

            for (var z = 0; z < arrayTime.length; z++) {
                if (arrayTime[z] === "0") {
                    arrayTime[z] = "00";
                }
            }

            stringList2 += " \r\n " + candle.time + " " + candle.pair.replace('_','/') + "-OTC " + orderType;
            index++;

            if (i > 0 && (i + 1) % 80 == 0) {
                i++;
                break;
            }
        }

		
    }

    
stringList2 += "\r________________________" +"\n\n\n\nMOST IMPORTANT NOTE : Every Hour Avoid First 10 Signals"+
"\nFor example: [ 02:00, 21:03 ,12:05, 21:07, 07:09, 11:05 ,13:01, 24:08]"+
"\nCOPYRIGHT BY SONIC TRADER";



document.getElementById("copyButton").addEventListener("click", function() {
        var previewText = document.getElementById("preview").innerText; // Get the text content
        var textArea = document.createElement("textarea"); // Create a temporary textarea element
        textArea.value = previewText; // Set the textarea value to the text to be copied
        document.body.appendChild(textArea); // Append the textarea to the body
        textArea.select(); // Select the text inside the textarea
        document.execCommand("copy"); // Execute the copy command
        document.body.removeChild(textArea); // Remove the textarea after copying
        alert("Text copied to clipboard!"); // Show a success message
    });


	// Display the result in the preview div //
	document.getElementById("preview").innerText = stringList2;
}


function GetStringResult(value) {
				if (value >0) {
					return 'PUT';
				} else if (value < 0) {
					return 'CALL';
				} else {
					return 'DRAW';
				}
			}




			function ErrorHistoric(error) {
				alert('YOU MAKE A MISTAKE.\n PLEASE TRY AGAIN');
			}

			function ConvertDate(time) {
    		var options = { timeZone: 'BANGLADESH/DHAKA' }; // Set to Bangladesh Standard Time
   		 	var dateObj = new Date(time);
   			var timeObj = new Object();
    		timeObj.date = dateObj;

    		var hours = ('0' + dateObj.getHours()).slice(-2); // Ensure two-digit representation
    		var minutes = ('0' + dateObj.getMinutes()).slice(-2); // Ensure two-digit representation
    		var seconds = ('0' + dateObj.getSeconds()).slice(-2); // Ensure two-digit representation
	
    		timeObj.time = hours + ':' + minutes; // Custom 24-hour format

    return timeObj;
			}

			$('#formHist').submit(function (e) {
				e.preventDefault();
				return false;
			});
