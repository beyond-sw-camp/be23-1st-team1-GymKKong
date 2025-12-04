--디비 만들기
create databases gymkkong;

--테이블 생성 
create databases gymkkong;

CREATE TABLE member(id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, phone_num VARCHAR(255),age VARCHAR(255),gender ENUM('m','f'), grade ENUM('BRONZE','GOLD','DIAMOND'));
CREATE TABLE place(id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, address VARCHAR(255) NOT NULL);
CREATE TABLE trainer(id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, phone_num VARCHAR(255));
CREATE TABLE room(id BIGINT AUTO_INCREMENT PRIMARY KEY,place_id BIGINT NOT NULL,room_num INT NOT NULL, FOREIGN KEY(place_id) REFERENCES place(id));
CREATE TABLE class(id BIGINT AUTO_INCREMENT PRIMARY KEY,trainer_id BIGINT NOT NULL,room_id BIGINT NOT NULL, class_name VARCHAR(255) NOT NULL, start_time DATETIME NOT NULL, capacity INT NOT NULL, FOREIGN KEY(trainer_id) REFERENCES trainer(id), FOREIGN KEY (room_id) REFERENCES room(id));
CREATE TABLE attendance(id BIGINT AUTO_INCREMENT PRIMARY KEY, class_id BIGINT NOT NULL, member_id BIGINT NOT NULL,status ENUM('Y','N') DEFAULT 'N', FOREIGN KEY(class_id) REFERENCES class(id), FOREIGN KEY (member_id) REFERENCES member(id));
CREATE TABLE membership_option(id BIGINT AUTO_INCREMENT PRIMARY KEY, class_id BIGINT NOT NULL, place_id BIGINT NOT NULL,count INT NOT NULL, price INT NOT NULL, FOREIGN KEY(place_id) REFERENCES place(id));
CREATE TABLE membership(id BIGINT AUTO_INCREMENT PRIMARY KEY, membership_option_id INT NOT NULL, member_id BIGINT NOT NULL, refund_YN ENUM('Y','N') DEFAULT 'N',remain_count INT NOT NULL, FOREIGN KEY (membership_option_id) REFERENCES membership_option(id), FOREIGN KEY (member_id) REFERENCES member(id));


--payment
create table payment(id bigint primary key auto_increment, membership_id bigint not null, pay_price bigint not null, pay_day datetime default current_timestamp() not null,  foreign key(membership_id) Reference membership(id) );
--refund
create table refund(id bigint primary key auto_increment, payment_id bigint not null, refund_price bigint not null, refund_day datetime default current_timestamp() not null,  foreign key(payment_id) Reference payment(id) );
--place_trainer
create table place_trainer(id bigint primary key auto_increment, place_id bigint not null,  trainer_id bigint not null, foreign key(place_id) Reference place(id), foreign key(trainer_id) Reference trainer(id));
--room_reserve
create table room_reserve(id bigint primary key auto_increment, place_trainer_id bigint not null,  room_id bigint not null, start_time datetime not null, foreign key(place_trainer_id) Reference place_trainer(id), foreign key(room_id) Reference room(id));
--post
create table post(id bigint primary key auto_increment, place_trainer_id bigint not null, title varchar(255) not null, post_contents varchar(255) not null,  post_day datetime default current_timestamp() not null, foreign key(place_trainer_id) Reference place_trainer(id));
--coment 
create table coment(id bigint primary key auto_increment, post_id bigint, member_id bigint, comment_contents varchar(255) not null, comment_day datetime default current_timestamp() not null, foreign key(post_id) Reference post(id), foreign key(member_id) Reference member(id) );
--admin
create table admin(id int primary key auto_increment, name varchar(255) not null, email varchar(255) not null, password varchar(255) not null, type enum('admin', 'super_admin') default 'admin'  );
