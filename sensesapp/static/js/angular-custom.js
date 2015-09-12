var underscore = angular.module('underscore', []);
underscore.factory('_', function() {
    'use strict';
    return window._; // assumes underscore has already been loaded on the page
});
var app = angular.module('senses', ['ngSanitize', 'ngCookies', 'ui.bootstrap', 'ngRoute', 'ui.select', 'underscore']);
app.run(function($http, $cookies) {
    console.log($cookies.csrftoken)
    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
});
app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});

app.service('masjid_data', function($rootScope) {
    var data = [];
    this.get_MasjidData = function() {
        return data;
    };
    this.set_MasjidData = function(masjid_data) {
        data = masjid_data;
    };

});

app.filter('propsFilter', function() {
    return function(items, props) {
        var out = [];
        if (angular.isArray(items)) {
            items.forEach(function(item) {
                var itemMatches = false;
                var keys = Object.keys(props);
                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }
                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }
        return out;
    }
});
app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
        when('/dashboard', {
            templateUrl: 'dashboard.html',
        }).
        when('/location', {
            templateUrl: 'location.html',
        }).
        when('/masjid', {
            templateUrl: 'masjid.html',
        }).
        when('/family', {
            templateUrl: 'family.html',
        }).
        when('/schemes', {
            templateUrl: 'schemes.html',
        }).
        otherwise({
            redirectTo: '/dashboard'
        });
    }
]);
app.directive('fileModel', ['$parse', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            element.bind('change', function() {
                scope.$apply(function() {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);
app.controller('dashboardCtrl', function($scope,_, $http,masjid_data, $location,$modal) {
    $scope.fetch_data = function() {
        $http.get('/fetchData/', {}).success(function(data) {
            $scope.courses = data.course;
            $scope.unique_course = _.filter($scope.courses, function(num){ return num.course_type == 'LECTURES'; });
            $scope.program = data.program;
            $scope.subjectAllocData.program = $scope.program[0];
            $scope.student_data = data.student;
            $scope.group_data = data.group;
            $scope.coursemap_data = data.course_map;
            $scope.fetchSubjectAllocData();
            $scope.subjectAllocData.group = $scope.group_data[0];
            $scope.get_group($scope.program[0],1)
            console.log('course_module',$scope.coursemap_data)
        })
    }
    $scope.fetch_data();
    $scope.group_value="Select the Group in the list or Enter New...";
    $scope.get_group = function(prog,sem) {
        console.log('program',prog,sem,$scope.group_data)
        $scope.group_list = [];       
        for(var i in $scope.group_data) {
            if($scope.group_data[i].program == prog.name && $scope.group_data[i].semester == sem) {
                $scope.group_list.push($scope.group_data[i].name)
                // console.log('program',$scope.group_list)
            }    
        }
    }
    $scope.scheme_val = 'SELECT SCHEMES';
    $scope.get_scheme = function(scheme) {
        if(!scheme) {
            $scope.scheme_val = 'SELECT SCHEMES';
        }
        else {
            console.log('val',scheme)
            $scope.scheme_val = scheme;
        }
    }
    $scope.sub_scheme_val = 'SELECT SUB SCHEME';
    $scope.get_sub_scheme = function(scheme) {
        console.log('val1',typeof(scheme))
        if(!scheme) {
            $scope.sub_scheme_val = 'SELECT SUB SCHEME';
        }
        else if(typeof(scheme) == 'string') {
            $scope.sub_scheme_val = scheme;
        }
        else if(typeof(scheme) == 'object') {
            $scope.sub_scheme_val = scheme.sub;
        }
        console.log('val',$scope.sub_scheme_val)
    }
    $scope.getScheme = function() {
        $http.get('/SchemeData/',{}).success(function(data) {
            console.log('datascheme',data)
            $scope.scheme_list = _.keys(data.data)
            $scope.getSubScheme = data.data;
        })
    }
    $scope.district_val = 'SELECT DISTRICT';
    $scope.get_district = function(district) {
        if(!district) {
            $scope.district_val = 'SELECT DISTRICT';
        }
        else {
            console.log('val',district)
            $scope.district_val = district;
        }
    }
    $scope.scheme_values = {
        scheme: '',
        sub_scheme: '',
        field: '',
        condition: '',
        value: '',
    }
    $scope.field_list = ['Age','Marital Status','Gender','Qualification','Voter ID','Physically Challenged','RelationShip','Occupation']
    $scope.condition_list = function(field) {
        if(field == 'Age' || field == 'Qualification') {
            $scope.conditionsData = ['<=','>=','=','>','<','!=']
        }
        else if(field == 'Marital Status' || field == 'Gender' || field == 'Voter ID' || field == 'Physically Challenged' || field == 'RelationShip' || field == 'Occupation') {
            $scope.conditionsData = ['=','!=']
        }
        if(field == 'Marital Status') {
            $scope.getValue = ['Married','Unmarried','Widow','Devorced','Aged Unmarried Woman']
        }
        else if(field == 'Gender') {
            $scope.getValue = ['Male','Female']
        }
        else if(field == 'Physically Challenged' || field == 'RelationShip') {
            $scope.getValue = ['Yes','No']
        }
        else {
            console.log('var',field)
            $scope.get_val()
            $scope.scheme_values.value = ''
            $scope.getValue = []
        }
        
    }
    $scope.taluk_val = 'SELECT TALUK';
    $scope.get_taluk = function(taluk) {
        if(!taluk) {
            $scope.taluk_val = 'SELECT TALUK';
        }
        else {
            $scope.taluk_val = taluk;
        }
    }
    $scope.masjid_val = '';
    $scope.get_masjid = function(masjid) {
        if(!masjid) {
            $scope.masjid_val = 'Select mahalla ID from the List';
        }
        else {
            $scope.masjid_val = masjid;
            $scope.getMasjidData($scope.masjid_val);
        }
    }
    $scope.value = '';
    $scope.get_val = function(val) {
        if(!val) {
            $scope.value = 'Select or Enter Value'
        }
        else {
            $scope.value = val;
        }

    }
    $scope.MasjidAddValue = {
        masjid_name: '',
        musallas: '',
        district: '',
        taluk: '',
        address: '',
    }
    $scope.mahallaList = [];
    $scope.getMasjidData = function(masjid_val) {
        console.log('masjid',masjid_val)
        $http.get('/add_masjid/').success(function(data){
            console.log('valuemasjid',data)
            $scope.mahallaList = data.data;
            $scope.masjidList = _.pluck(data.data,"mohalla_id")
            if(!masjid_val) {
                $scope.MasjidAddValue.masjid_name = '';
                $scope.MasjidAddValue.mohalla_id = '';
                $scope.MasjidAddValue.musallas = '';
                $scope.MasjidAddValue.district = '';
                $scope.MasjidAddValue.taluk = '';
                $scope.MasjidAddValue.address = '';
            }
            else {
                $scope.getMasjidListData = _.filter(data.data,function(num) { return num.mohalla_id==masjid_val})
                $scope.MasjidAddValue.mohalla_id = $scope.getMasjidListData[0].mohalla_id;
                $scope.MasjidAddValue.masjid_name = $scope.getMasjidListData[0].name;
                $scope.MasjidAddValue.musallas = $scope.getMasjidListData[0].musallas;
                $scope.MasjidAddValue.district = $scope.getMasjidListData[0].district;
                $scope.MasjidAddValue.taluk = $scope.getMasjidListData[0].taluk;
                $scope.MasjidAddValue.address = $scope.getMasjidListData[0].location;
                $scope.getMasjidMember($scope.MasjidAddValue);
                console.log('data',$scope.getMasjidListData)
            }
        })
    }
    $scope.getMasjidMember = function(data) {
        console.log('masjid_member',data)
        $http.get('/masjid_member/?masjid_id=' + data.mohalla_id).success(function(data){
        // $http.get('/masjid_member/?masjid=' + data.masjid_name+'&taluk='+data.taluk+'&district='+ data.district).success(function(data){
            $scope.masjid_member_list = data.data;
            console.log('data',data)
        })
    }

    $scope.addMasjid = function(masjid,data) {
        console.log(data,masjid)
        if(data.mohalla_id == "") {
            var masjid_val = masjid
        }
        else {
            var masjid_val = data.mohalla_id
        }
        console.log('masjid',masjid,'a',data.mohalla_id,'b',masjid_val)
        $http.post('/add_masjid/',{
            district: data.district,
            taluk: data.taluk,
            masjid_name: masjid,
            mohalla_id: masjid_val,
            musallas: data.musallas,
            address: data.address,
        }).success(function(data) {
            console.log('val',data)
            alert(data.data)
            $scope.new_masjid=false;
        })
    }
    $scope.add_location = function(district,taluk) {
        console.log('val',district,'taluk',taluk)
        $http.post('/addLocation/',{
            district: district,
            taluk: taluk,
        }).success(function(data) {
            console.log('data',data)
            alert(data.data)
            $scope.getLocation();
        })
    }
    $scope.add_schemes = function(scheme,sub,scheme_values) {
        console.log('val',scheme,'taluk',sub,'scheme_values',scheme_values)
        $http.post('/SchemeData/',{
            scheme: scheme,
            sub: sub,
            field: scheme_values.field,
            condition: scheme_values.condition,
            value: scheme_values.value,
        }).success(function(data) {
            console.log('data',data)
            alert(data.data)
            window.location.reload()
            $scope.getLocation();
        })
    }
    $scope.getMahallaData = function(val) {
        $scope.muhallaData = _.filter($scope.mahallaList, function(data){ return data.district == val.district && data.taluk == val.taluk })
    }
    $scope.getLocation = function() {
        $http.get('/addLocation/',{}).success(function(data) {
            $scope.district_list = _.keys(data.data)
            $scope.getTaluk = data.data;
        })
    }
    $scope.add_members = function(data) {
        console.log('masjid_data',data)
        masjid_data.set_MasjidData(data);
        var modalInstance = $modal.open({
            templateUrl: 'add_members_modal',
            controller: add_members_ctrl,
            backdrop: 'true',
        });
    }
    var add_members_ctrl=function($scope,$http,masjid_data,$rootScope,$timeout,$location,$modalInstance) {
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
        var data = masjid_data.get_MasjidData();
        $scope.add_member = function(member_name,age,designation,mobile,address,status) {
            console.log('member_name',member_name,data)
            $http.post('/masjid_member/',{
                member_name: member_name,
                data: data,
                age: age,
                designation: designation,
                mobile: mobile,
                address: address,
            }).success(function(response) {
                alert(response.data)
                if(status == 'continue') {
                   $scope.member_name = '';
                   $scope.age = '';
                   $scope.designation = '';
                   $scope.mobile = '';
                   $scope.address = '';
                }
                else if(status == 'exit') {
                    $modalInstance.dismiss('cancel');
                    window.location.reload();
                }
                console.log('response',response)
            })
        }
    }

    $scope.family_val = '';
    $scope.get_family = function(family) {
        if(!family) {
            console.log(family,'family')
            $scope.family_val = 'Type or Select Family ID from the List';
            $scope.FamilyValue.familyid='';
            $scope.FamilyValue.ration_card = '';
            $scope.FamilyValue.mobile_no = '';
            $scope.FamilyValue.address = '';
            $scope.FamilyValue.house = '';
            $scope.FamilyValue.toilet = '';
            $scope.FamilyValue.financial = '';
            $scope.FamilyValue.district = '';
            $scope.FamilyValue.taluk = '';
            $scope.FamilyValue.masjid = '';
            $scope.FamilyValue.donor = '';
            $scope.FamilyValue.volunteer = '';
            $scope.FamilyValue.health_insurance = '';
            $scope.FamilyValue.family_needs = '';
        }
        else {
            $scope.family_val = family.family_id;
            $scope.FamilyValue.ration_card = family.ration_card;
            $scope.FamilyValue.mobile_no = family.mobile;
            $scope.FamilyValue.address = family.address;
            $scope.FamilyValue.house = family.house_type;
            if(family.toilet == true) { $scope.FamilyValue.toilet = 'Yes'; } else if(family.toilet == false) { $scope.FamilyValue.toilet = 'No'; }
            $scope.FamilyValue.financial = family.financial_status;
            $scope.FamilyValue.district = family.district_name
            $scope.FamilyValue.taluk = family.taluk;
            $scope.FamilyValue.masjid = family.muhalla;
            if(family.donor == true) { $scope.FamilyValue.donor = 'Yes'; } else if(family.donor == false) { $scope.FamilyValue.donor = 'No'; }
            if(family.health_insurance == true) { $scope.FamilyValue.health_insurance = 'Yes'; } else if(family.health_insurance == false) { $scope.FamilyValue.health_insurance = 'No'; }
            if(family.volunteer == true) { $scope.FamilyValue.volunteer = 'Yes'; } else if(family.volunteer == false) { $scope.FamilyValue.volunteer = 'No'; }
            $scope.FamilyValue.family_needs = family.family_needs;
            // $scope.getMasjidData();
        }
    }
    $scope.FamilyValue = {
        familyid: '',
        masjid: '',
        ration_card: '',
        address: '',
        mobile: '',
        district: '',
        taluk: '',
        house: '',
        toilet: '',
        donor: '', 
        volunteer: '', 
        health_insurance: '', 
        family_needs: '', 
        financial: '',
    }
    $scope.addFamily = function(family,value,status) {
        console.log('family',family,'value',status)
        if(status == 'new') {
            var familyid = '';
            var masjid = value.masjid.name;
        }
        else if(status == 'update') {
            var familyid = family;
            var masjid = value.masjid;
        }
        var data = {
            mobile_no: value.mobile_no,
            taluk: value.taluk,
            district: value.district,
            masjid: masjid,
            toilet: value.toilet,
            donor: value.donor,
            volunteer: value.volunteer,
            health_insurance: value.health_insurance,
            familyid: familyid,
            ration_card: value.ration_card,
            address: value.address,
            family_needs: value.family_needs,
            house: value.house,
            financial: value.financial,
        }
        console.log('val',data,familyid,masjid)
        // if(data.masjid_name == "") {
        //     var masjid_val = masjid
        // }
        // else {
        //     var masjid_val = data.masjid_name
        // }
        console.log('masjid',masjid,'a',data,'b')
        $http.post('/familyData/',{
            value: data,
        }).success(function(data) {
            console.log('val',data)
            alert(data.data)
            $scope.getFamilyinfo();
        })
    }

    $scope.getFamilyinfo = function() {
        console.log('get',$scope.FamilyValue.familyid)
        // $http.get('/add_masjid/').success(function(data){
        //     $scope.mahallaList = data.data;
        //     $scope.masjidList = _.pluck(data.data,"name")
        //     if($scope.masjidList.indexOf($scope.masjid_val)==-1) {
        //         $scope.MasjidAddValue.masjid_name = '';
        //         $scope.MasjidAddValue.musallas = '';
        //         $scope.MasjidAddValue.district = '';
        //         $scope.MasjidAddValue.taluk = '';
        //         $scope.MasjidAddValue.address = '';
        //     }
        //     else {
        //         $scope.getMasjidListData = _.filter(data.data,function(num) { return num.name==$scope.masjid_val})
        //         $scope.MasjidAddValue.masjid_name = $scope.getMasjidListData[0].name;
        //         $scope.MasjidAddValue.musallas = $scope.getMasjidListData[0].musallas;
        //         $scope.MasjidAddValue.district = $scope.getMasjidListData[0].district;
        //         $scope.MasjidAddValue.taluk = $scope.getMasjidListData[0].taluk;
        //         $scope.MasjidAddValue.address = $scope.getMasjidListData[0].location;
        //         $scope.getMasjidMember($scope.MasjidAddValue);
        //         console.log('data',$scope.getMasjidListData)
        //     }
        // })
        $http.get('/familyData/', {}).success(function(data) {
            $scope.familyList = data.data;
            
            console.log('val',$scope.FamilyValue)
        })
    }
    $scope.FamilyMember = {
        mem_id : '',
        name : '', 
        gender : '', 
        age : '', 
        relationship : '', 
        qualification : '', 
        marital_status : '', 
        voter : '', 
        location : '', 
        occupation : '', 
    }
    $scope.add_Familymembers = function(data,family,status) {
        console.log('data',data,family)
        $http.post('/FamilyMemberData/',{
            data: data,
            status: status,
            familyid: family.familyid.family_id,
        }).success(function(response) {
            alert(response.data)
            console.log('response',response)
        })
    }

    $scope.positionUpdated = function(module,session) {
        $scope.course_value = 'Select the Module in the list or Enter New... ';
        console.log('module',$scope.course_value,module)
        console.log('val',session)
        if(module == 'with') {
            $scope.course_module = true;
        }
        else if(module == 'without') {
            $scope.course_module = false;
        }
    }
    $scope.periods = ['Period 1','Period 2','Period 3','Period 4','Period 5','Period 6','Period 7','Period 8'];
    $scope.get_unique_ctype = function(course_type) {
        return  _.without(_.uniq(_.pluck($scope.courses, 'course_type')),"");
    }
    $scope.get_unique_course = function(course_type,module) {
        if(module == '') {
            $scope.unique_course = _.filter($scope.courses, function(num){ return num.course_type == course_type; });
            return $scope.unique_course;
        }
        else {
            return _.filter($scope.courses, function(num){ return num.module == module && num.course_type == course_type; });
        }
    }

    $scope.get_unique_module = function(course_type) {
        return  _.without(_.uniq(_.pluck(_.filter($scope.courses, function(num){ return num.course_type == course_type; }), 'module')),"");
        // var uniqCourse = _.filter($scope.courses, function(num){ return pluck_module.indexOf(num.module) != -1; });
        // return pluck_module
    }

    $scope.upload_csv = function(csv_file, to) {
        console.log(csv_file, to)
        var csv_file = csv_file;
        var fileUrl = '/upload_bulk_csv/';
        var send = new FormData();
        send.append('csv_file', csv_file);
        $http.post(fileUrl, send, {
            data: to,
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        }).success(function(data) {
            console.log('val', data)
            alert(data.data)
        });
    }

    $scope.sizeUpdated = function(day, session) {

        var periodIndex = day.allocs.indexOf(session);
        console.log(periodIndex,session,day.allocs)

        var tempStartHour = parseInt(session.session_start) + session.session_length;

        for (var i = periodIndex + 1; i < day.allocs.length; i++) {
            if(day.allocs[i].name == 'Period 5' || day.allocs[i].subject== 'Lunch Break') {
                console.log('????',day.allocs)
                day.allocs[i].session_start = 4;
                day.allocs[i].session_length = 1;
                day.allocs[i].subject = 'Lunch Break';

            }
            else if(day.allocs[i].name || day.allocs[i].subject || day.allocs[i].staff) {
                console.log('????',day.allocs)
                day.allocs[i].session_start = parseInt(day.allocs[i].session_start);
                day.allocs[i].session_length = day.allocs[i].session_length;
            }
            else {
                day.allocs[i].session_start = parseInt(session.session_start);
                day.allocs[i].session_length = session.session_length;
            }
            console.log(tempStartHour);
            console.log(day.allocs)
            // tempStartHour = day.allocs[i].session_start + day.allocs[i].session_length;
        };



    }



    $scope.addNewPeriod = function(day, session) {
        var lastPeriod = day.allocs[day.allocs.length - 1];
        var session_start = 0;
        console.log('session',lastPeriod)
        if (session != undefined) {
            console.log(session);
            lastPeriod = session;
            console.log('lastPeriod',lastPeriod,'lastPeriodsession',parseInt(lastPeriod.session_length))
            session_start = parseInt(lastPeriod.session_start) + parseInt(lastPeriod.session_length);
        };
        // var lastPeriod = day.allocs[day.allocs.length - 1];
        var periodIndex = day.allocs.indexOf(lastPeriod) + 1;

        console.log(day.allocs,'111',session_start)
        var tempData = {
            name: 'Period ' + (day.allocs.length),
            subject: '',
            staff: '',
            session_start: session_start,
            session_length: 1,
            selected: false
        };
        console.log(day.allocs.length)
        day.allocs.splice(periodIndex + 1, 0, tempData);
        console.log('session_start',day.allocs,'lastPeriod',lastPeriod)
        var tempStartHour = day.allocs[periodIndex].session_start + day.allocs[periodIndex].session_length;


        $scope.periodClicked(day,day.allocs[periodIndex + 1])

        for (var i = periodIndex + 1; i < day.allocs.length; i++) {
            console.log(tempStartHour);
            day.allocs[i].session_start = tempStartHour;
            tempStartHour = day.allocs[i].session_start + day.allocs[i].session_length;
        };
    }


    $scope.dayClicked = function(day) {

        console.log("dayClicked", day);

        $scope.selectedDay = day;


        console.log("dayClicked", $scope.selectedDay);


    }


    $scope.periodClicked = function(day, session) {

        $scope.dayClicked(day);
        

        console.log("periodClicked", day, session, $scope.selectedDay, $scope.selectedSession);

        $scope.selectedSession = session;




    }


    $scope.get_program = function() {
        return _.filter($scope.program,function(num){ return _.uniq(_.pluck($scope.group_data, "program")).indexOf(num.name) != -1; });
    }


    $scope.getStaffStudentData = function(staff) {
        console.log('attendance',staff)
        $http.get("/attendance_sheet/?instructor=" + staff.user, {}).success(function(response) {
            var data = response.data;
            var student_program = [];
            for(var i in data) {
                student_program.push(data[i].program)
            }
            $scope.staff_student_program = _.uniq(student_program);
            $scope.staff_student_data = response.programData;
        });
    }
    $scope.getStudentData = function(person,program,group) {
        console.log(person,program,group)
        $http.post('/getStudent_data/',{
            person : person,
            program : program,
            group : group,
        }).success(function(data){
            console.log('data')
            $scope.student_list = data.data;
            // console.log($scope.attendanceData)

            
            for(var stud in $scope.student_list){
                $scope.student_list[stud]['sessions'] = {}
                for(var ses in $scope.attendanceData['sessions']){
                   $scope.student_list[stud]['sessions'][$scope.attendanceData['sessions'][ses]] = true;
                }
                // console.log()
            }
            $http.get("/add_attendance/?instructor=" + person.user, {}).success(function(response) {
                
            })
            // for(i in $scope.attendanceData){

            //     student.sessions[a]
            // }
        })
    }

    $scope.login = function(name, password) {
        var data = {
            username: name,
            password: password,
        }
        console.log(data)
        $http({
            method: 'POST',
            url: '/login_page/',
            data: data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).success(function(response) {
            console.log(response)
            if (response.data == 'success') {
                window.location.href = '/home/'
            }
        });
    }
    $scope.signup = function(name, password) {
        var data = {
            username: name,
            password: password,
        }
        $http({
            method: 'POST',
            url: '/signup/',
            data: data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).success(function(data) {
            console.log(data)
        })
    }

})


// request.onupgradeneeded = function() {
//    var db = request.result;
//    var store = db.createObjectStore("student", {keyPath: "studentid", autoIncrement : true});
//    var idIndex = store.createIndex("studentid", "studentid", {unique: true});
//    var nameIndex = store.createIndex("name", "name");
//    var courseIndex = store.createIndex("course", "course");
//    var yearIndex = store.createIndex("year", "year");
//    var attendanceIndex = store.createIndex("attendance", "attendance");
//    var dateIndex = store.createIndex("date", "date");
//  };