/* Local browser QA: every API response is a fixture; external network is blocked. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.PHASE2_QA_URL || 'http://127.0.0.1:3100';
const output = 'docs/qa/phase2b';
let activePage;
fs.mkdirSync(output,{recursive:true});
const rep={id:'fixture-rep',name:'Fixture Representative',area:'Fixture Territory',assignedHospitals:5,assignedPharmacies:5,assignedDrs:5};
const plan={id:'fixture-plan',rep:rep.name,startDate:'2026-09-05',endDate:'2026-09-11',weekLabel:'Fixture weekly plan',status:'Submitted',saturdayAm:'Saturday morning visit',saturdayPm:'Saturday afternoon visit',sundayAm:'Follow up',fridayPm:'Weekly summary'};
const hospital={id:'fixture-hospital',name:'Fixture Hospital',area:'Fixture Territory',type:'Private',contact:'Fixture Contact',phone:'01000000000',defaultCycle:7,rep:rep.name,lastVisit:'2026-09-07',status:'Visited',notes:'Fixture notes'};
const activity={id:'fixture-activity',activityType:'Visit',activityDate:'2026-09-07',userId:'fixture-manager',userName:'Fixture Manager',userPosition:'DM',visitType:'Double',accompaniedPerson:rep.name,morningHospitalName:hospital.name,afternoonPharmacyName:'Fixture Pharmacy',generalComment:'Fixture activity comment'};
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});const results=[];const errors=[];
 for(const role of ['MR','DM'])for(const lang of ['en','ar']){
  const context=await browser.newContext();await context.addInitScript(value=>localStorage.setItem('rep_track_lang',value),lang);
  const requests=[];let failReports=false;let savedActivity=null;
  await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(!url.pathname.startsWith('/api/'))return route.continue();requests.push({path:url.pathname,query:url.search,method:route.request().method()});
   let body={success:true};let status=200;
   if(url.pathname==='/api/auth/session')body={authenticated:true,user:{id:role==='MR'?'fixture-mr':'fixture-manager',name:role==='MR'?rep.name:'Fixture Manager',username:role==='MR'?'MR1':'DM1',repId:role==='MR'?rep.id:null,role:role==='MR'?'REPRESENTATIVE':'MANAGER',positionCode:role,systemRole:role==='MR'?'REPRESENTATIVE':'MANAGER',primarySalesAssignment:{territoryName:'Fixture Territory'}}};
   else if(url.pathname==='/api/reps')body={success:true,reps:[rep]};
   else if(url.pathname==='/api/reports'){status=failReports?500:200;body={hospitals:[hospital],pharmacies:[],doctors:[],branches:[],availabilities:[{id:'availability-1',hospital:hospital.name,product:'Fixture Product',month:'Sep',status:'Available',createdAt:'2026-09-07'}],events:[],trainings:[],specialTasks:[],managerActivities:role==='MR'?[]:[activity],reps:role==='MR'?[]:[rep]};}
   else if(url.pathname==='/api/weekly-plans')body={success:true,plans:[{...plan,isManagerPlan:role!=='MR'}],plan};
   else if(url.pathname==='/api/lists')body={success:true,data:{hospitals:[hospital],pharmacies:[],doctors:[],branches:[]}};
   else if(url.pathname==='/api/manager/activities'){if(route.request().method()==='POST')savedActivity=route.request().postDataJSON();body={success:true,activities:[activity]};}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  });
  const page=await context.newPage();activePage=page;page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base);await page.getByRole('button',{name:lang==='en'?'Log out':'تسجيل الخروج'}).waitFor();
  const navigate=async label=>{let button=page.getByRole('navigation').getByRole('button',{name:label,exact:true}).filter({visible:true}).first();if(!await button.count()){await page.getByRole('button',{name:lang==='en'?'Open navigation':'فتح التنقل',exact:true}).click();button=page.getByRole('navigation').getByRole('button',{name:label,exact:true}).filter({visible:true}).first();}await button.click();await page.waitForTimeout(120);};
  const screens=role==='MR'?(lang==='en'?['Overview','My Reports','Weekly Plan','My Lists','Product Availability']:['نظرة عامة','تقاريري','الخطة الأسبوعية','قوائمي','توافر المنتجات']):(lang==='en'?['Overview','Team Reports','Submit Activity','My Reports','My Weekly Plan','Team Plans','Team Lists','Product Availability']:['نظرة عامة','تقارير الفريق','تسجيل نشاط','تقاريري','خطتي الأسبوعية','خطط الفريق','قوائم الفريق','توافر المنتجات']);
  for(const width of [360,390,768,1024,1280,1440]){
   await page.setViewportSize({width,height:900});
   for(let index=0;index<screens.length;index++){
    await navigate(screens[index]);
    const overflow=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,dir:document.documentElement.dir}));
    assert.equal(overflow.dir,lang==='ar'?'rtl':'ltr');
    results.push({role,lang,width,screen:screens[index],overflow:overflow.scroll-overflow.width});
    if(overflow.scroll>overflow.width+1)throw new Error(`Overflow ${JSON.stringify(results.at(-1))}`);
    if((width===360||width===1280)&&(index===1||screens[index]==='Submit Activity'||screens[index]==='تسجيل نشاط'))await page.screenshot({path:`${output}/${role}-${lang}-${width}-${index}.png`,fullPage:true});
   }
  }
  await page.setViewportSize({width:390,height:900});
  await navigate(role==='MR'?(lang==='en'?'My Reports':'تقاريري'):(lang==='en'?'Team Reports':'تقارير الفريق'));
  const details=page.getByRole('button',{name:lang==='en'?'Details':'التفاصيل',exact:true}).filter({visible:true}).first();await details.click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  for(let n=0;n<12;n++){await page.keyboard.press('Tab');assert(await dialog.evaluate(el=>el.contains(document.activeElement)));}
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await details.evaluate(el=>el===document.activeElement));
  if(role==='DM'){
   const scope=page.getByLabel(lang==='en'?'Team scope':'نطاق الفريق');await scope.selectOption('DIRECT_REPORTS');await page.waitForTimeout(150);assert(requests.some(r=>r.path==='/api/reports'&&r.query.includes('scopeMode=DIRECT_REPORTS')));
   await navigate(lang==='en'?'Team Plans':'خطط الفريق');await page.getByLabel(lang==='en'?'Scope':'النطاق',{exact:true}).selectOption('DIRECT_REPORTS');await page.waitForTimeout(150);assert(requests.some(r=>r.path==='/api/weekly-plans'&&r.query.includes('team=true&scopeMode=DIRECT_REPORTS')));
   await navigate(lang==='en'?'Team Lists':'قوائم الفريق');await page.getByText(lang==='en'?'Select a representative to browse their lists':'اختر مندوباً لاستعراض قوائمه',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:lang==='en'?'Add customer':'إضافة عميل',exact:true}).count(),0);
   await navigate(lang==='en'?'Submit Activity':'تسجيل نشاط');await page.getByLabel(lang==='en'?'Visit type':'نوع الزيارة',{exact:true}).selectOption('Double');await page.getByRole('button',{name:lang==='en'?'Submit activity report':'حفظ تقرير النشاط',exact:true}).click();assert.equal(savedActivity,null);await page.getByLabel(lang==='en'?'Accompanied person':'الشخص المرافق',{exact:false}).fill('Fixture Companion');await page.getByRole('button',{name:lang==='en'?'Submit activity report':'حفظ تقرير النشاط',exact:true}).click();await page.waitForTimeout(150);assert.equal(savedActivity.visitType,'Double');assert.equal(savedActivity.accompaniedPerson,'Fixture Companion');assert.equal(savedActivity.userId,undefined);
  }else{assert(requests.filter(r=>r.path==='/api/reports').every(r=>!r.query.includes('rep=')));}
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(`${output}/responsive-results.json`,JSON.stringify({results,errors},null,2));console.log(`PASS ${results.length} responsive checks, both directions, drawer keyboard/focus, team scopes, list landing, manager validation, MR request identity`);await browser.close();
})().catch(async error=>{if(activePage){console.log((await activePage.locator('body').innerText()).slice(0,3000));await activePage.screenshot({path:`${output}/failure.png`,fullPage:true});}console.error(error);process.exit(1);});
