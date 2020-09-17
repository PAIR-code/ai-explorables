/* Copyright 2019 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/


function lerp(a, b, t){ return a + t*(b - a) }

function addVec([a0, a1], [b0, b1]){
  return [a0 + b0, a1 + b1]
}

function phyllotaxis(i, initialRadius=10, initialAngle=Math.PI*(3 - Math.sqrt(5))){
  i = i + Math.random()/20

  var r = initialRadius*Math.sqrt(Math.random() + i)
  var angle = i*initialAngle

  return [r*Math.cos(angle), r*Math.sin(angle)]
}
       
var names = {
  old_m: 'James John Robert Michael William David Richard Joseph Thomas Charles Christopher Daniel Matthew Anthony Donald Mark Paul Steven Andrew Kenneth Joshua George Kevin Brian Edward Ronald Timothy Jason Jeffrey Ryan Jacob Gary Nicholas Eric Stephen Jonathan Larry Justin Scott Brandon Frank Benjamin Gregory Samuel Raymond Patrick Alexander Jack Dennis Jerry Tyler Aaron Jose Henry Douglas Adam Peter Nathan Zachary Walter Kyle Harold Carl Jeremy Keith Roger Gerald Ethan Arthur Terry Christian Sean Lawrence Austin Joe Noah Jesse Albert Bryan Billy Bruce Willie Jordan Dylan Alan Ralph Gabriel Roy Juan Wayne Eugene Logan Randy Louis Russell Vincent Philip Bobby Johnny Bradley'.split(' '),
  old_f: 'Mary Patricia Jennifer Linda Elizabeth Barbara Susan Jessica Sarah Karen Nancy Margaret Lisa Betty Dorothy Sandra Ashley Kimberly Donna Emily Michelle Carol Amanda Melissa Deborah Stephanie Rebecca Laura Sharon Cynthia Kathleen Helen Amy Shirley Angela Anna Brenda Pamela Nicole Ruth Katherine Samantha Christine Emma Catherine Debra Virginia Rachel Carolyn Janet Maria Heather Diane Julie Joyce Victoria Kelly Christina Joan Evelyn Lauren Judith Olivia Frances Martha Cheryl Megan Andrea Hannah Jacqueline Ann Jean Alice Kathryn Gloria Teresa Doris Sara Janice Julia Marie Madison Grace Judy Theresa Beverly Denise Marilyn Amber Danielle Abigail Brittany Rose Diana Natalie Sophia Alexis Lori Kayla Jane'.split(' '),
  m: 'Noah Liam Jacob Mason William Ethan Michael Alexander James Elijah Daniel Benjamin Aiden Jayden Logan Matthew David Joseph Lucas Jackson Anthony Joshua Samuel Andrew Gabriel Christopher John Dylan Carter Isaac Ryan Luke Oliver Nathan Henry Owen Caleb Wyatt Christian Sebastian Jack Jonathan Landon Julian Isaiah Hunter Levi Aaron Eli Charles Thomas Connor Brayden Nicholas Jaxon Jeremiah Cameron Evan Adrian Jordan Gavin Grayson Angel Robert Tyler Josiah Austin Colton Brandon Jose Dominic Kevin Zachary Ian Chase Jason Adam Ayden Parker Hudson Cooper Nolan Lincoln Xavier Carson Jace Justin Easton Mateo Asher Bentley Blake Nathaniel Jaxson Leo Kayden Tristan Luis Elias Brody Bryson Juan Vincent Cole Micah Ryder Theodore Carlos Ezra Damian Miles Santiago Max Jesus Leonardo Sawyer Diego Alex Roman Maxwell Eric Greyson Hayden Giovanni Wesley Axel Camden Braxton Ivan Ashton Declan Bryce Timothy Antonio Silas Kaiden Ezekiel Jonah Weston George Harrison Steven Miguel Richard Bryan Kaleb Victor Aidan Jameson Joel Patrick Jaden Colin Everett Preston Maddox Edward Alejandro Kaden Jesse Emmanuel Kyle Brian Emmett Jude Marcus Kingston Kai Alan Malachi Grant Jeremy Riley Jayce Bennett Abel Ryker Caden Brantley Luca Brady Calvin Sean Oscar Jake Maverick Abraham Mark Tucker Nicolas Bradley Kenneth Avery Cayden King Paul Amir Gael Graham Maximus'.split(' '),
 f: 'Emma Sophia Olivia Isabella Ava Mia Abigail Emily Madison Charlotte Elizabeth Amelia Chloe Ella Evelyn Avery Sofia Harper Grace Addison Victoria Natalie Lily Aubrey Lillian Zoey Hannah Layla Brooklyn Samantha Zoe Leah Scarlett Riley Camila Savannah Anna Audrey Allison Aria Gabriella Hailey Claire Sarah Aaliyah Kaylee Nevaeh Penelope Alexa Arianna Stella Alexis Bella Nora Ellie Ariana Lucy Mila Peyton Genesis Alyssa Taylor Violet Maya Caroline Madelyn Skylar Serenity Ashley Brianna Kennedy Autumn Eleanor Kylie Sadie Paisley Julia Mackenzie Sophie Naomi Eva Khloe Katherine Gianna Melanie Aubree Piper Ruby Lydia Faith Madeline Alexandra Kayla Hazel Lauren Annabelle Jasmine Aurora Alice Makayla Sydney Bailey Luna Maria Reagan Morgan Isabelle Rylee Kimberly Andrea London Elena Jocelyn Natalia Trinity Eliana Vivian Cora Quinn Liliana Molly Jade Clara Valentina Mary Brielle Hadley Kinsley Willow Brooke Lilly Delilah Payton Mariah Paige Jordyn Nicole Mya Josephine Isabel Lyla Adeline Destiny Ivy Emilia Rachel Angelina Valeria Kendall Sara Ximena Isla Aliyah Reese Vanessa Juliana Mckenzie Amy Laila Adalynn Emery Margaret Eden Gabrielle Kaitlyn Ariel Gracie Brooklynn Melody Jessica Valerie Adalyn Adriana Elise Michelle Rebecca Daisy Everly Katelyn Ryleigh Catherine Norah Alaina Athena Leilani Londyn Eliza Jayla Summer Lila Makenzie Izabella Daniela Stephanie Julianna Rose Alana Harmony Jennifer Hayden'.split(' '),
 last: 'SMITH JOHNSON WILLIAMS BROWN JONES GARCIA MILLER DAVIS RODRIGUEZ MARTINEZ HERNANDEZ LOPEZ GONZALEZ WILSON ANDERSON THOMAS TAYLOR MOORE JACKSON MARTIN LEE PEREZ THOMPSON WHITE HARRIS SANCHEZ CLARK RAMIREZ LEWIS ROBINSON WALKER YOUNG ALLEN KING WRIGHT SCOTT TORRES NGUYEN HILL FLORES GREEN ADAMS NELSON BAKER HALL RIVERA CAMPBELL MITCHELL CARTER ROBERTS GOMEZ PHILLIPS EVANS TURNER DIAZ PARKER CRUZ EDWARDS COLLINS REYES STEWART MORRIS MORALES MURPHY COOK ROGERS GUTIERREZ ORTIZ MORGAN COOPER PETERSON BAILEY REED KELLY HOWARD RAMOS KIM COX WARD RICHARDSON WATSON BROOKS CHAVEZ WOOD JAMES BENNETT GRAY MENDOZA RUIZ HUGHES PRICE ALVAREZ CASTILLO SANDERS PATEL MYERS LONG ROSS FOSTER JIMENEZ POWELL JENKINS PERRY RUSSELL SULLIVAN BELL COLEMAN BUTLER HENDERSON BARNES GONZALES FISHER VASQUEZ SIMMONS ROMERO JORDAN PATTERSON ALEXANDER HAMILTON GRAHAM REYNOLDS GRIFFIN WALLACE MORENO WEST COLE HAYES BRYANT HERRERA GIBSON ELLIS TRAN MEDINA AGUILAR STEVENS MURRAY FORD CASTRO MARSHALL OWENS HARRISON FERNANDEZ MCDONALD WOODS WASHINGTON KENNEDY WELLS VARGAS HENRY CHEN FREEMAN WEBB TUCKER GUZMAN BURNS CRAWFORD OLSON SIMPSON PORTER HUNTER GORDON MENDEZ SILVA SHAW SNYDER MASON DIXON MUNOZ HUNT HICKS HOLMES PALMER WAGNER BLACK ROBERTSON BOYD ROSE STONE SALAZAR FOX WARREN MILLS MEYER RICE SCHMIDT GARZA DANIELS FERGUSON NICHOLS STEPHENS SOTO WEAVER RYAN'.split(' ').map(d => d[0] + d.slice(1).toLowerCase())
}
