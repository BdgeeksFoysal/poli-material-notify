Cheerio = Meteor.require('cheerio');

var Emails = new Meteor.Collection('emails');
var Courses = new Meteor.Collection('courses');

if(Emails.find({email: 'foysal@bdgeeks.com'}).count() < 1){
	Emails.insert({
		email: 'foysal@bdgeeks.com'
	});
}

if(Courses.find({code: '01OGDLM'}).count() < 1){
	Courses.insert({
		code: '01OGDLM',
		url: 'http://fmgroup.polito.it/quer/teaching/apaEn/laib/soluzioni/lab',
		latest: 0
	});
}

var PolitoMaterials = function(course_code){
	this.get_course = function(course_code){
		var course = Courses.find({code: course_code}, {limit: 1}).fetch();

		if(course.length > 0)
			return course[0];
		else
			return false;
	};

	this.course = this.get_course(course_code);
	this.url = this.course.url;
	this.latest = this.course.latest;

	this.get_url_content = function(material_number) {
		var result = Meteor.http.get(this.url+material_number, {timeout:30000});

		if(result.statusCode==200) {
		    return this.get_body_content(result.content);
		} else {
		    console.log("Content issue: ", result.statusCode);
		    throw new Meteor.Error("");
		}
	};

	this.get_body_content = function(content){
		var pattern = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
		return pattern.exec(content);
	};

	this.get_materials = function(){
		var empty = 0,
			i = 1;
		while (i <= 13 && empty == 0) {
			if(i < 10) 
				var number = '0' + i;
			else
				var number = i;

			var body = this.get_url_content(number),
				$ = Cheerio.load(body[0]);

			if ($('table').find('tr').eq(4).length <= 0) {
				empty = 1;
			}

			++i;
		}

		this.latest = i-2;
		return i-2;
	};

	this.update_latest_material = function(){
		var latest = this.get_materials();
		console.log('Latest Material - ' + latest);

		if( latest > this.course.latest){
			Courses.update({_id:this.course._id}, {$set: {latest: latest}});
			return true;
		}else{
			return false;
		}
	};

	this.notify_subscribers = function(){
		var emails = Emails.find({}).fetch();

		if( emails.length > 0 ){
			Email.send({
				from: 'foysal@foysal.me',
				to: emails,
				subject: 'New materials have been uploaded',
				html: '<p>New Materials has been posted.</p>'
			});
		}
	};
}

var materials = new PolitoMaterials('01OGDLM');
if(materials.update_latest_material() === true){
	materials.notify_subscribers();
}