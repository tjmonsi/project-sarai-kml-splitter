# SARAI KML Splitter

## How to install

```
npm install
```

## How to run

Create `kml` folder where `index.js` is and then put KML files inside the kml folder

```
node index.js
```

The program will start by showing an address. Copy-paste the address to Browser, allow the Google to manage your user account, copy the code from the URL and paste it on the command line.

## Motivation

Philippine Suitability KML maps are very large. Usually around 100 - 250 MB range... The problem is that uploading them as is will render the server useless. We used Fusion Tables but it still doesn't work because of the limitations of Fusion Table. 

We figured that the reason is that the MultiGeometry tags inside the KML has a lot of Polygon tags, and Fusion Table doesn't show more than 10 Polygon tags per MultiGeometry. So we thought of splitting the KML files into separate KML files which has 5 Polygon tags at most file. Then putting it inside the table.

## Limitations

Fusion Table has a limit of 1 GB per user account. This is because they are putting it inside the Google Account User's drive. We have hit the 1GB account already on one account, so we are uploading the remaining KML files to another account.

There's also a limitation of 250 MB per table. We still haven't hit it but the Coconut KMLs has 250 MB size per file. If the system crashes, we will try to work around it.