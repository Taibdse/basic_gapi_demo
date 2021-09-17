var firebaseConfig = {
  apiKey: "AIzaSyBl7DrPCLThLSgDDPTcKGjvVv1F46Ud8a0",
  authDomain: "oauth2-demo-63c74.firebaseapp.com",
  projectId: "oauth2-demo-63c74",
  storageBucket: "oauth2-demo-63c74.appspot.com",
  messagingSenderId: "843627032276",
  appId: "1:843627032276:web:90e94deb01ddbcf20ad541"
};

// Initialize Firebase
var firebaseApp = firebase.initializeApp(firebaseConfig);
var firebaseDb = firebaseApp.firestore();
var firebaseAuth = firebaseApp.auth();

var provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('email');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

loadGapiClient();

function loadGapiClient() {
  gapi.load('client', function () {
    gapi.client.load('drive', 'v2', function () {
      console.log('loaded gapi drive')
    });
    gapi.client.load('calendar', 'v3', function () {
      console.log('loaded gapi calendar')
    });
    gapi.client.load('https://people.googleapis.com/$discovery/rest', 'v3', function () {
      console.log('loaded gapi contacts')
    });
    gapi.client.load('sheets', 'v4', function () {
      console.log('loaded gapi spreadsheets')
    });
    gapi.client.load('gmail', 'v1', function () {
      console.log('loaded gapi gmail')
    });
  });
}

function renderDriveData(driveData) {
  var tbody = $('#driveTable').find('tbody').html('');
  driveData.forEach(function (item, idx) {
    tbody.append(`
      <tr>
        <td>${idx + 1}</td>
        <td>
          <a href="${item.alternateLink}">${item.title}</a>
        </td>
        <td>
          <img src="${item.iconLink}" style="width: 20px">
        </td>
        <td>${item.createdDate}</td>
        <td>${item.fileSize} byte</td>
      </tr>
    `);
  })
}

function renderUserInfo(user) {
  $('#userInfo').find('#email span').text(user.email);
  $('#userInfo').find('#displayName span').text(user.displayName);
  $('#userInfo').find('#phone span').text(user.phoneNumber);
  $('#userInfo').find('#avatar img').attr('src', user.photoURL);
}

function getGoogleDriveFiles() {
  var request = gapi.client.drive.files.list({ maxResults: 10 });
  request.execute(function (res) {
    renderDriveData(res.items)
  })
}

function renderGoogleContactData(data) {
  var tbody = $('#contactsInfo').find('table tbody').html('');
  data.forEach(function (item, idx) {
    var name = (item.names && item.names.length > 0) ? item.names[0].displayName : '';
    var email = (item.emailAddresses && item.emailAddresses.length > 0) ? item.emailAddresses[0].value : '';
    var phone = (item.phoneNumbers && item.phoneNumbers.length > 0) ? item.phoneNumbers[0].canonicalForm : '';

    tbody.append(`
      <tr>
        <td>${idx + 1}</td>
        <td>${name}</td>
        <td>${email}</td>
        <td>${phone}</td>
      </tr>
    `);
  })
}

function getGoogleContacts() {
  gapi.client.people.people.connections.list({
    'resourceName': 'people/me',
    'pageSize': 30,
    'personFields': 'names,emailAddresses,phoneNumbers',
  }).then(function (res) {
    console.log(res)
    renderGoogleContactData(res.result.connections)
  });
}

function getGoogleCalendarData() {
  gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 10,
    'orderBy': 'startTime'
  }).then(function (res) {
    console.log(res);
    renderGoogleCalendarData(res.result.items);
  })
}

function renderGoogleCalendarData(data) {
  var tbody = $('#calendarInfo').find('table tbody').html('');
  data.forEach(function (item, idx) {
    tbody.append(`
      <tr>
        <td>${idx + 1}</td>
        <td>
          <a href="${item.htmlLink}">${item.summary}</a>
        </td>
        <td>
          ${item.eventType}
        </td>
        <td>${item.start.dateTime}</td>
        <td>${item.end.dateTime}</td>
        <td>${item.creator.email}</td>
        <td>${item.organizer.email}</td>
      </tr>
    `);
  })
}

function getGoogleMailData() {
  gapi.client.gmail.users.messages.list({
    maxResults: 20,
    userId: 'me'
  }).then(function (res) {
    console.log(res);
  }).catch(function (err) {
    console.log(err);
  })

  // gapi.client.gmail.users.messages.get({
  //   id: "17bf438ae01ed3e6",
  //   userId: 'me'
  // }).then(function (res) {
  //   console.log(res);
  // }).catch(function (err) {
  //   console.log(err);
  // })
}

function handleLogin() {
  firebase.auth()
    .signInWithPopup(provider)
    .then((result) => {
      var credential = result.credential;
      var token = credential.accessToken;
      var user = result.user;
      window.result = result;

      // reformat the token object for the Google Drive API
      var tokenObject = {
        access_token: token
      };

      // set the authentication token
      gapi.auth.setToken(tokenObject);

      renderUserInfo(user);

      getGoogleDriveFiles();
      getGoogleContacts();
      getGoogleCalendarData();
      getGoogleMailData();

    }).catch((error) => {
      console.log(error);
    });
}

$('#btnLogin').on('click', handleLogin);
