const { default: axios } = require("axios");
const { env } = require("../db/constant");
const commonFun = require("./commonFun");
module.exports = {
  getPlaceName: async (latitude, longitude) => {
    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${env.GoogleKey}`;

    return new Promise((resolve, reject) => {
      axios.get(apiUrl)
        .then(response => {
          const data = response.data;
          if (data.status === 'OK' && data.results.length > 0) {
            const placeName = data.results[0].formatted_address;
            resolve(placeName);
          } else {
            reject(false);
          }
        })
        .catch(error => reject(error));
    });
  },
  getLocationDetails:async(locationName)=> {
    return new Promise(async (resolve, reject) => {
      try {
          const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
              params: {
                  address: locationName,
                  key: env.GoogleKey,
              },
          });

          const result = response.data.results[0];
          if (result) {
            let country,state,city;
            result.address_components.forEach(address => {
              if (address.types.indexOf('country') >= 0)
                country = address.long_name
              else if (address.types.indexOf('administrative_area_level_1') >= 0)
                state = address.long_name
              else if (address.types.indexOf('locality') >= 0 || address.types.indexOf('administrative_area_level_2') >= 0)
                city = address.long_name;
            });
              const locationDetails = {
                  locationName: result.formatted_address,
                  locality: {
                      type: 'Point',
                      coordinates: [result.geometry.location.lng, result.geometry.location.lat],
                  },
                  city: city,
                  state: state,
                  country:country,
              };
              console.log(locationDetails,'locationDetails>>>>>>>>>>>>>>>>>>')
              resolve(locationDetails);
          } else {
              console.error('No results found for the given location name.');
              reject("No results found for the given location name");
          }
      } catch (error) {
        console.log(error,'error>>>>>>>>>>>>>>>>>>')
          console.error('Error fetching location details:', error.message);
          reject("Error fetching location details");
      }
  });
}



}