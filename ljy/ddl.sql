--커밋 테스트
--디비 만들기
create
databases gymkkong;

--post
create table post
(
    id               bigint primary key auto_increment,
    place_trainer_id bigint                               not null,
    title            varchar(255)                         not null,
    contents         varchar(255)                         not null,
    post_date        datetime default current_timestamp() not null,
    foreign key (place_trainer_id) Reference place_trainer(id)
);
--comment
create table comment
(
    id           bigint primary key auto_increment,
    post_id      bigint                               not null,
    member_id    bigint                               not null,
    contents     varchar(255)                         not null,
    comment_date datetime default current_timestamp() not null,
    foreign key (post_id) Reference post(id),
    foreign key (member_id) Reference member (id)
);

--admin
create table admin
(
    id       bigint primary key auto_increment,
    name     varchar(255) not null,
    email    varchar(255) not null,
    password varchar(255) not null,
    type     enum ('admin', 'super_admin') default 'admin'
);