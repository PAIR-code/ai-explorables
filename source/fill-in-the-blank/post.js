/* Copyright 2021 Google LLC. All Rights Reserved.

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

async function post(route, obj) {
  var body = JSON.stringify(obj);
  var cacheKey = body + route;
  // if (route == 'embed_zari_cda') return
  // if (route != 'embed_group_top') return
  // route = 'embed_group'

  if (!window.postCache) postCache = {};
  if (postCache[cacheKey]) return postCache[cacheKey];

  if (cacheKey2filename[cacheKey]) {
    var res = await fetch('data/' + cacheKey2filename[cacheKey]);
  } else {
    // var root = 'http://' + location.hostname + ':5004/'
    var root = 'https://helloworld-66dm2fxl4a-uk.a.run.app/';
    var res = await fetch(root + route, {method: 'POST', body});
  }

  var rv = await res.json();
  postCache[cacheKey] = rv;

  return rv;
}

// copy(postCache)
// data/post-cache.json
