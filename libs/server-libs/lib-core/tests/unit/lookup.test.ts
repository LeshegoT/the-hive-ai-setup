import { describe, expect, test } from '@jest/globals';

import { Lookup } from "../../src/lookup";

type SampleType = {
    id: number,
    description: string
}

const sampleObjects: SampleType[] = [
    {id:1, description:"Value 1"},
    {id:2, description:"Value 2"},
    {id:3, description:"Value 3"},
    {id:4, description:"Value 4"},
];

describe("Lookup tests",()=>{
    test("Construct the lookup", ()=>{
        const lookup = new Lookup("sample", sampleObjects, "id", "description");
        expect(lookup).toBeDefined();
    });
    test("Get lookup object from ID",()=>{
        const lookup = new Lookup("sample", sampleObjects, "id", "description");
        for(const sample of sampleObjects){
            expect(lookup.getById(sample.id)).toEqual(sample);
        }
    });
    test("Get lookup object from description",()=>{
        const lookup = new Lookup("sample", sampleObjects, "id", "description");
        for(const sample of sampleObjects){
            expect(lookup.getByDescription(sample.description)).toEqual(sample);
        }
    });
    test("Get lookup id from description",()=>{
        const lookup = new Lookup("sample", sampleObjects, "id", "description");
        for(const sample of sampleObjects){
            expect(lookup.idFromDescription(sample.description)).toEqual(sample.id);
        }
    });
    test("Get lookup id from description",()=>{
        const lookup = new Lookup("sample", sampleObjects, "id", "description");
        for(const sample of sampleObjects){
            expect(lookup.descriptionFromId(sample.id)).toEqual(sample.description);
        }
    });

})




