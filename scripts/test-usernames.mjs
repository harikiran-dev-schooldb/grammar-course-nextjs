import assert from "node:assert/strict";
import {test} from "node:test";
import {normalizeUsername,isValidUsername} from "../src/lib/usernames.ts";

test("username is trimmed and lowercased",()=>{
 assert.equal(normalizeUsername("  Hari_Kiran09 "), "hari_kiran09");
 assert.equal(normalizeUsername("USER"),"user");
});
test("usernames contain only 3-30 ASCII letters, numbers and underscore",()=>{
 for(const value of ["harikiran","abc","student_23","a".repeat(30)])assert.equal(isValidUsername(value),true);
 for(const value of ["ab","a".repeat(31),"hello world","x@y.com","a-b","తెలుగు",""])assert.equal(isValidUsername(value),false);
});
