/* 
Name: Eline Rietdijk
Studentnumber: 10811834
*/

var provincies;
var chart_svg;
var current_data;

window.onload = function() {
	
	// load datasets using a queue 
	d3.queue()
	.defer(d3.csv, "nederland_criminaliteit_totaal.csv")
	.defer(d3.csv, "nederland_misdrijven_relatief.csv")
	.await(create_map)
}



function create_map(error, criminaliteit_totaal, criminaliteit_soort) {

	console.log(criminaliteit_soort)
	var Groningen = ["Groningen"];
	var Friesland = ["Friesland"];
	var Drenthe = ["Drenthe"];
	var Overijssel = ["Overijssel"];
	var Flevoland = ["Flevoland"];
	var Gelderland = ["Gelderland"];
	var Utrecht = ["Utrecht"];
	var NoordHolland = ["Noord-Holland"];
	var ZuidHolland = ["Zuid-Holland"];
	var NoordBrabant = ["Noord-Brabant"];
	var Limburg = ["Limburg"];
	var Zeeland = ["Zeeland"];

	provincies = [Groningen, Friesland, Drenthe, Overijssel, Flevoland, Gelderland, 
		Utrecht, NoordHolland, ZuidHolland, NoordBrabant, Limburg, Zeeland]

	for (i = 0; i < provincies.length; i ++) {
		for(j = 0; j < criminaliteit_soort.length; j ++) {
			if (provincies[i][0] == criminaliteit_soort[j].Provincie) {
				provincies[i].push(criminaliteit_soort[j])
			}
		}
		provincies[i].splice(0, 1)
	}

	console.log(provincies)

	// set margins for whitespace on sides of the graph
	var margin = {top: 10, right: 30, bottom: 70, left: 75},

		// set width and height of the total svg
		width = 1100
		height = 600

	// set width of individual elements
	chart_width = width / 2 + 100 - margin.left - margin.right
	chart_height = height - margin.top - margin.bottom
	map_width = width / 2 - 100

	// select svg element and create svg with appriopriate width and height
	var map_svg = d3.select(".map_svg")
		.append("svg")
		.attr("width", map_width)
		.attr("height", height);

	var g = map_svg.append("g")

	var projection = d3.geo.mercator()
		.scale(1)
		.translate([0, 0]);

	var path = d3.geo.path()
		.projection(projection);

	var map_tip = d3.tip()
		.attr("class", "map_tip")
		.offset([-10, 0])
		.html(function(d, i) {
			return "<text style = 'color:whitesmoke'>"+ d.RegioS +":" + d.GeregistreerdeMisdrijvenPer1000Inw_3 + " Misdrijven per 1000 inwoners</text>";
		})

	map_svg.call(map_tip)

	var map_colors = d3.scale.quantize()
		.domain([40, 45, 50, 55, 60, 65, 75])
		.range(["#ffe6e6", "#ffb3b3", "#ff8080", 
			"#ff6666", "#ff1a1a", "#ff0000", "#cc0000"])


	d3.json("netherlands.json", function(error, nld) {
		g.selectAll("path")
			var l = topojson.feature(nld, nld.objects.subunits).features[3],
				b = path.bounds(l),
				s = .2 / Math.max((b[1][0] - b[0][0]) / (map_width + 200), (b[1][1] - b[0][1]) / (height + 200)),
				t = [(map_width - 150 - s * (b[1][0] + b[0][0])) / 2, ((height + 50) - s * (b[1][1] + b[0][1])) / 2];
			
			projection
				.scale(s)
				.translate(t)

			g.selectAll("path")
				.data(topojson.feature(nld, nld.objects.subunits).features).enter()
				.append("path")
				.attr("d", path)
				.attr("stroke", "black")
				.attr("class", function(d, i) {
					return d.properties.name;
				})
				.attr("fill", function(d, i) {
					if (d.properties.name != null) {
						for (var j = 0; j < criminaliteit_totaal.length; j ++) {
							if (criminaliteit_totaal[j].RegioS == d.properties.name) {
								value = criminaliteit_totaal[j]
							}
						}
						return map_colors(value.GeregistreerdeMisdrijvenPer1000Inw_3);
					}
					else {
						return "grey"
					}
				})		
				.on("mouseover", function(d, i) {
					for (var j = 0; j < criminaliteit_totaal.length; j ++) {
							if (criminaliteit_totaal[j].RegioS == d.properties.name) {
								value = criminaliteit_totaal[j]
							}
						}
					map_tip.show(value, i)
					d3.select(this).style("opacity", 0.5)
				})
				.on("mouseout", function(d, i) {
					map_tip.hide(d, i)
					d3.select(this).style("opacity", 1)
				})
				.on("click", function(d, i) {
					click_event(d.properties.name)
				})
	});
	
	chart_svg = d3.select(".chart_svg")
		.append("svg")
		.attr("width", chart_width + margin.left + margin.right)
		.attr("height", chart_height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.right + ")");
	
	chart_colors = d3.scale.category10();
	
	// create y function to scale values for y-axis
	var y = d3.scale.linear()
		.range([chart_height, 0])
		.domain([0, 70]);

	// create x function to scale ordinal values, because x-values are month names
	var x = d3.scale.ordinal()
		.rangeRoundBands([0, chart_width], 0.05)
		.domain(provincies[0].map(function(d) { return d.Misdrijf}));

	// create x-axis based on scale and oriented at the bottom
	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.tickFormat(function(d) {return d + "%"});

	// append x-axis to the chart
	chart_svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + chart_height + ")")
		.call(xAxis)
		.selectAll("text").remove()

	chart_svg.append("text")
		.attr("class", "label")
		.attr("x", chart_width / 2)
		.attr("y", height - margin.bottom / 1.5) // HIER MISSCHIEN NOG AANPASSEN
		.style("text-anchor", "middle")
		.style("font-size", 15)
		.text("Soort Misdrijf")


	// append text labels as legenda
	chart_svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("class", "label")
		.attr("transform", "rotate(-90)")
		.attr("x", 0)
		.attr("y", - margin.left / 1.2)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Percentage van totaal");

	// calculate barwidth, based on width and amount of bars 
	var barWidth = chart_width / 12

	var chart_tip = d3.tip()
		.attr("class", "chart_tip")
		.offset([-10, 0])
		.html(function(d) {
			return "<text style = 'color:black'>"+ d.Misdrijf +": " + d.GeregistreerdeMisdrijvenRelatief_2 + "%</text>";
		})

	chart_svg.call(chart_tip)

	current_data = provincies[6];

	chart_svg.selectAll("#legendaColors")
		.data(current_data)
		.enter().append("rect")
		.attr("id", "legendaColors")
		.attr("class", "legenda")
		.attr("x", 300)
		.attr("y", function(d, i) {return 0 + 25 * i})
		.attr("width", 20)
		.attr("height", 20)
		.style("fill", function(d) {return chart_colors(d.Misdrijf)})

	chart_svg.selectAll("#legendaText")
		.data(current_data)
		.enter().append("text")
		.attr("id", "legendaText")
		.attr("class", "legenda")
		.attr("x", 325)
		.attr("y", function(d, i) {return 12 + 25 * i})
		.attr("width", 50)
		.attr("height", 40)
		.text(function(d) {return d.Misdrijf})
		.attr("text-anchor", "start")

	// create bar (rect) for each datapoint with corresponding scaled height
	var bar = chart_svg.selectAll(".bar")
		.data(current_data).enter()
		.append("rect")
		.attr("class", function(d, i) {return "bar" + i})
		.attr("y", function(d) {return y(d.GeregistreerdeMisdrijvenRelatief_2); })
		.attr("x", function(d) {return x(d.Misdrijf)})
		.attr("height", function(d) {return chart_height - y(d.GeregistreerdeMisdrijvenRelatief_2); })
		.attr("width", x.rangeBand())
		.style("fill", function(d) {return chart_colors(d.Misdrijf)})
		.on("mouseover", function(d) {
			chart_tip.show(d)
			d3.select(this).style("opacity", 0.7)
		})
		.on("mouseout", function(d) {
			chart_tip.hide(d, i)
			d3.select(this).style("opacity", 1)
		});


}

function click_event(location) {
	if (location == "Groningen") {
		current_data = provincies[0];
	}
	else if (location == "Friesland"){
		current_data = provincies[1];
	}
	else if (location == "Drenthe"){
		current_data = provincies[2];
	}
	else if (location == "Overijssel"){
		current_data = provincies[3];
	}
	else if (location == "Flevoland"){
		current_data = provincies[4];
	}
	else if (location == "Gelderland"){
		current_data = provincies[5];
	}
	else if (location == "Utrecht"){
		current_data = provincies[6];
	}
	else if (location == "Noord-Holland") {
		current_data = provincies[7];
	}
	else if (location == "Zuid-Holland") {
		currentData = provincies[8];
	}
	else if (location == "Noord-Brabant") {
		currentData = provincies[9];
	}
	else if (location == "Limburg"){
		current_data = provincies[10];
	}
	else {
		current_data = provincies[11];
	};

	var transition = chart_svg.transition().duration(750), 
		delay = function(d, i) { return i * 50};

	console.log(current_data)
} 






