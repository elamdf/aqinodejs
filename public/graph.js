$(document).ready(function() {

	function createSensor(sensorDisplayName, sensorName, sensorUnits) {
		return {
			displayName: sensorDisplayName,
			name: sensorName,
			units: sensorUnits,
		};
	}
	// ADD SENSORS HERE
	var sensors = [
		createSensor("Temperature (°C)", "temp", "°C"),
		createSensor("Humidity (%)", "humidity", "%"),
		createSensor("CO₂ Concentration (ppm)", "co2", "ppm"),
		createSensor("NO₂ Concentration (ppm)", "no2", "ppm"),
		createSensor("NH₃ Concentration (ppm)", "nh3", "ppm"),
		createSensor("CO Concentration (ppm)", "co", "ppm"),
		createSensor("Air Pressure (hPa)", "pressure", "hPa")
	];

	sensorYAxis = [];
	for (var i = 0; i < sensors.length; i++) {
		let line = {
			title: {
				text: sensors[i].displayName
			},
			top: i * (100 / sensors.length) + "%",
			height: (100 / sensors.length) + "%",
			id: sensors[i].name,
		}
		if (i % 0 === 1) {
			line.backgroundColor = "#666666"
		}
		sensorYAxis.push(line);
	}

	var sensChart = new Highcharts.stockChart({
		rangeSelector: {
			enabled: true,
			allButtonsEnabled: true
					},
		title: {
			text: 'Sensor Data'
		},
		yAxis: sensorYAxis,
		tooltip: {
			split: true
		},
		chart: {
			type: 'spline',
			zoomType: "x",
			renderTo: 'chart_container',
			events: {
			}
		},


	});


	function colorHash(str){
		var hash = 0
		for (var i = 0; i < str.length; i++) {
			 hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		hash = (hash & 0x00FFFFFF).toString(16).toUpperCase();
		return "00000".substring(0, 6 - hash.length) + hash;
	}



	socket.on('chartInit', function (sample) { // initalize with historical data

		// erase all current series

		if (sensChart.get(sample.name+"_"+sensors[0].name) !== undefined) {
			for (let i = 0; i < sensors.length; i++) {
				sensChart.get(sample.name+"_"+sensors[i].name).remove(true);
			}
		}


		console.log("#" + colorHash(sample.name));
		console.log("test1");

		function initLine(sensChart, sensorName, units, axis) {
			sensChart.addSeries(
				{
					data:(sample.data.map(function(value,index) {
						return [value[0],
						value[1]]
					})),
					name:sample.name,
					id:sample.name+"_"+sensorName,
					yAxis:axis,
					tooltip:{valueSuffix:units},
					color:"#" + colorHash(sample.name)
				}
			);
		}

		function initLine(sensor, axis) {
			sensChart.addSeries(
				{
					data:(sample.data.map(function(value,index) {
						return [value[0],
						value[axis+1]]
					})),
					name:sample.name,
					id:sample.name+"_"+sensor.name,
					yAxis:axis,
					tooltip:{valueSuffix:sensor.units},
					color:"#" + colorHash(sample.name)
				}
			);
		}

		sensors.forEach((sensor, i) => {
			initLine(sensor, i)
		});


	});
	socket.on('chartUpdate', function (sample){
		function updateLine(sensor, axis) {
			sensChart.get(sample.name+"_"+sensor.name).addPoint([sample.data[0][0], sample.data[0][axis+1]]);
		}
		sensors.forEach((sensor, i) => {
			updateLine(sensor, i);
		});
	});
	socket.on("averagesInit", function (sample){
		// TODO put week and day averages in addition to alltime
		document.getElementById("averages").innerHTML = `<b>Average Temperature:</b>${sample.data[0]}°C <b>Average Humidity:</b>${sample.data[1]}% <b>Average Pressure:</b> ${sample.data[2]}hPa <b>Average CO2 Concentration:</b> ${sample.data[3]}ppm`
	});

});
