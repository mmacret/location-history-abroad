# location-history-abroad 

**Available online: https://countdowntocitizenship.com**

A tool to help you count down your absences from Canada using your collected [Location History](https://google.com/locationhistory).

It works directly in your web browser &ndash; no software to download, no packages to install. **Everyone deserves to know what data is being collected about them, without having to fiddle with cryptic pieces of software.**

*location-history-abroad* takes raw Google Takeout output, analyze it and extracts all your absences from Canada. These absences are plotted on a map as polylines as they are discovered. They can also be visualized in a table and downloaded as CSV/Excel file.

## Packages used
* [leaflet.js](http://leafletjs.com/), for rendering the interactive map
* [filestream](https://github.com/DamonOehlman/filestream), for dealing with gigantic Google Takeout files
* [oboe.js](http://oboejs.com), for processing said gigantic files
* [browserify](http://browserify.org/), for helping filestream work properly in the browser
* [bluebird](http://bluebirdjs.com), a promise library for displaying absences as they are found
* [datatables](https://datatables.net/), a jQuery plug-in that add advanced controls (export to CSV/Excel, etc) to HTML tables
* [snakeanim.js](https://github.com/IvanSanchez/Leaflet.Polyline.SnakeAnim), a plugin for Leaflet.js to make polylines animate into existence
* [countries.geo](https://github.com/johan/world.geo.json), lightweight world country polygon dataset for fast offline reverse-geocoding

## Credit

This project is based on the [location-history-visulizer](https://github.com/theopolisme/location-history-visualizer) open-source project.

## License 

Copyright (C) 2017 mmacret <contact@matthieumacret.com> 

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
