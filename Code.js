var cc = DataStudioApp.createCommunityConnector();

function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}

function getConfig(request) {
  var config = cc.getConfig();
  
  config.newInfo()
    .setId('Instructions')
    .setText('Enter IP address to get country data from GeoIP database.');
  
  config.newTextInput()
    .setId('ip_address')
    .setName('Enter a single IP Address')
    .setHelpText('e.g. 34.68.105.172')
    .setPlaceholder('34.68.105.172');
  
  config.setDateRangeRequired(true);
  
  return config.build();
}

function getFields(request) {
  var fields = cc.getFields();
  var types = cc.FieldType;
  
  fields.newDimension()
    .setId('continent.name')
    .setType(types.TEXT);

  fields.newDimension()
    .setId('continent.code')
    .setType(types.TEXT);

  fields.newDimension()
    .setId('country.iso_code')
    .setType(types.TEXT);
  
  fields.newDimension()
    .setId('country.name')
    .setType(types.TEXT);

  fields.newDimension()
    .setId('subdivisions.most_specific.name')
    .setType(types.TEXT);

  fields.newDimension()
    .setId('subdivisions.most_specific.iso_code')
    .setType(types.TEXT);

  fields.newDimension()
    .setId('city.name')
    .setType(types.TEXT);
  
  fields.newDimension()
    .setId('postal.code')
    .setType(types.TEXT);
  
  fields.newDimension()
    .setId('location.latitude')
    .setType(types.NUMBER);

  fields.newDimension()
    .setId('location.longitude')
    .setType(types.NUMBER);
  
  fields.newDimension()
    .setId('traits.network')
    .setType(types.TEXT);
  
  return fields;
}

function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

function responseToRows(requestedFields, response, packageName) {
  // Transform parsed data and filter for requested fields
  return response.map(function(dailyDownload) {
    var row = [];
    requestedFields.asArray().forEach(function (field) {
      switch (field.getId()) {
        case 'day':
          return row.push(dailyDownload.day.replace(/-/g, ''));
        case 'downloads':
          return row.push(dailyDownload.downloads);
        case 'packageName':
          return row.push(packageName);
        default:
          return row.push('');
      }
    });
    return { values: row };
  });
}

function getData(request) {
  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields().forIds(requestedFieldIds);

  // Fetch and parse data from API
  var url = [
    'https://dev-dunder-mifflin-legacy-site.pantheonsite.io/geoip.php?ip=',
    request.configParams.ip_address
  ];
  var response = UrlFetchApp.fetch(url.join(''));
  var parsedResponse = JSON.parse(response);
  var rows = responseToRows(requestedFields, parsedResponse, request.configParams.ip_address);

  return {
    schema: requestedFields.build(),
    rows: rows
  };
}
