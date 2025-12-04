--디비 만들기
create databases gymkkong;

--테이블 생성 

--payment
create table payment(id bigint primary key auto, membership_id bigint not null, pay_price bigint not null, pay_day datetime default current_timestamp() not null,  foreign key(membership_id) Reference membership(id) );
--refund
create table refund(id bigint primary key auto, payment_id bigint not null, refund_price bigint not null, refund_day datetime default current_timestamp() not null,  foreign key(payment_id) Reference payment(id) );
--place_trainer
create table place_trainer(id bigint primary key, place_id bigint not null,  trainer_id bigint not null, foreign key(place_id) Reference place(id), foreign key(trainer_id) Reference trainer(id));
--room_reserve
create table room_reserve(id bigint primary key, place_trainer_id bigint not null,  room_id bigint not null, start_time datetime not null, foreign key(place_trainer_id) Reference place_trainer(id), foreign key(room_id) Reference room(id));
--post
create table post(id bigint primary key, place_trainer_id bigint not null, title varchar(255) not null, post_contents varchar(255) not null, foreign key(place_trainer_id) Reference place_trainer(id));
--coment 
create table coment(id bigint primary key, post_id bigint, member_id bigint, comment_contents varchar(255) not null, foreign key(post_id) Reference post(id), foreign key(member_id) Reference member(id) );
--admin
create table admin(id int primary key, name varchar(255) not null, email varchar(255) not null, password varchar(255) not null, type enum('admin', 'super_admin') default 'admin'  );
