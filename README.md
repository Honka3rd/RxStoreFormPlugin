# RxStoreFormPlugin

A form Validation JavaScript library based on [rx-store-core](https://www.npmjs.com/package/rx-store-core)

## Install

npm i rx-store-form-plugin

## Validation for normal JavaScript object validation

import library:

```javascript
import { NRFormBuilder } from "rx-store-form-plugin";
```

## Define field types and meta types

### fields is an array contains information to describe each field state
type define:
```javascript
{
  field: string; // field name, should be unique
  value: any; // field value
  touched: boolean; // the field is touched or not
  changed: boolean; // the value in this field is changed or not
  focused: boolean; // this field is focused or not
  hovered: boolean; // this field is hovered by mouse or not
  type: DatumType; // field is SYNC(sync validated) or ASYNC(bulk async validated) or EXCLUDED(excluded async validated)
  lazy?: boolean; // if field type is EXCLUDED, whether wait for previous resolve
}[]
```
each element inside this array is a field data

### metadata stands for the validation result for each field
type define
```javascript
{
  errors: object; // required error message
  warn?: any; // optional warning message
  info?: any; // optional information
}
```

can be shortly written by: 
```javascript
FormControlMetadata<Error extends object, Warn = any, Info = any>
```

```javascript
import { FormControlStrDatum, FormControlDatum, FormControlMetadata } from "rx-store-form-plugin"; // handy type definitions for define form types
// NRFormBuilder<Fields, Metadata>(...)
const sampleFormBuilder = new NRFormBuilder<
  [
    FormControlStrDatum<"uid">, // define a field with the name of 'uid' and value type is string
    FormControlStrDatum<"username">, // define a field with the name of 'username' and value type is string
    FormControlDatum<"subscribed", boolean> // define a field with the name of 'subscribed' and value type is boolean
  ],
  {
    uid: {
      errors: {
        invalidLength?: "length should be greater than 5" | null
      }
    }, // define metadata for 'uid'
    username: FormControlMetadata<{
      invalidSymbol?: "user's name should not contains symbol of '$'" | null
    }>,// define metadata for 'username'
  }
>(...)
```

## Form ID and Sync validator

formSelector stands for id of a form
validator is for Sync validate and return a metadata object
validator will be called once the entire form data change
```javascript
const sampleFormBuilder = new NRFormBuilder<...>(
  {
    formSelector: "sample" as const,
      validator: (form, meta) => {
        // validate uid field
      if (form[0].value.length < 5)) {
        if (meta.uid) {
          meta.uid.errors = {
            invalidLength: "length should be greater than 5",
          };
        }
      }
      // validate username field
      if (
        form[1].value.includes("$")
      ) {
        if (meta.username) {
          meta.username.errors = {
            invalidSymbol: "user's name should not contains symbol of '$'",
          };
        }
      }
      return meta;
    }
  }
)

```

## Init typed form fields

```javascript
const sampleFormBuilder = new NRFormBuilder<...>({...})
  .setFields([
    {
      field: "uid", // field name
      defaultValue: "", // default value for this field
        type?: field is SYNC(sync validated) or ASYNC(bulk async validated) or EXCLUDED(excluded async validated),
        $validator?: function description: (
          arg1 is field value, 
          arg2 is metadata for this field, 
          arg3 is entire form data
          ) => Promise or Observable resolve metadata, 
          // triggered by current field data changed, just for NRF
        $immutableValidator?: function description: (
          arg1 is field value, 
          arg2 is metadata for this field, 
          arg3 is entire immutable form data
          ) => Promise or Observable resolve immutable metadata, 
          // triggered by current field data changed, just for IRF
        lazy?: if field type is EXCLUDED, whether wait for previous pending get resolved,
        debounceDuration?: if field type is EXCLUDED, the debounce time
        datumKeys?: if field type is EXCLUDED, only the selected fields for comparing,
        comparator?: if the form type is NRF and field type is EXCLUDED, a comparator determine whether to call $validator or not, type def: (v1: any, v2: any) => boolean
      },
    {
      field: "username",
      defaultValue: "",
    },
    {
      field: "subscribed",
      defaultValue: false,
    },
  ])  
  // default metadata to start
  .setDefaultMeta({
    uid: { 
      errors: {
        invalidLength: "length should be greater than 5"
      } 
    },
    username: { errors: {} },
  });

```

** Code Example **

```javascript
const {
  selector,
  initiator,
  observeMeta,
  observeMetaByField,
  observeFormData,
  observeFormDatum,
  observeFormValue,
  changeFormValue,
  getDatum,
} = sampleFormBuilder.getInstance();

const store = NRS({
  [selector()]: initiator,
  other: () => ({
    name: "",
    ph: "",
  }),
});

const stopValidation = sampleFormBuilder.getInstance().startValidation();

observeFormValue("uid", (result) => {
  console.log("uid", result);
});

observeMeta((meta) => {
  console.log("meta observed", meta);
});

setTimeout(() => {
  changeFormValue("uid", "xxx");
}, 1000);

setTimeout(() => {
  changeFormValue("uid", "111");
  changeFormValue("username", "jQuery$");
}, 5000);

setTimeout(() => {
  stopValidation?.();
}, 7000);

setTimeout(() => {
  changeFormValue("uid", "");
  changeFormValue("username", "");
}, 8000);
```
