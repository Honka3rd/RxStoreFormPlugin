# RxStoreFormPlugin

Beta version, do not use this in production!!!

** Code Example **
```javascript
const sampleFormBuilder = new NRFormBuilder<
  [
    FormControlStrDatum<"uid">,
    FormControlStrDatum<"username">,
    FormControlDatum<"subscribed", boolean>
  ],
  {
    uid: FormControlMetadata<{
      invalidLength?: "length should be greater than 5" | null
    }>,
    username: FormControlMetadata<{
      invalidSymbol?: "user's name should not contains symbol of '$'" | null
    }>,
  }
>({
  formSelector: "sample" as const,
  validator: (form, meta) => {
    /*     if (!meta.uid) {
      meta.uid = {
        errors: {},
      };
    }

    if (!meta.username) {
      meta.username = {
        errors: {},
      };
    }
 */
    if (form.find(({ field, value }) => field === "uid" && value.length < 5)) {
      if (meta.uid) {
        meta.uid.errors = {
          ...meta.uid.errors,
          invalidLength: "length should be greater than 5",
        };
      }
    }

    if (
      form.find(
        ({ field, value }) =>
          field === "username" && String(value).includes("$")
      )
    ) {
      if (meta.username) {
        meta.username.errors = {
          ...meta.username.errors,
          invalidSymbol: "user's name should not contains symbol of '$'",
        };
      }
    }
    console.log("in validator", meta);
    return meta;
  },
})
  .setFields([
    {
      field: "uid",
      defaultValue: "",
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
  .setDefaultMeta({
    uid: { errors: {} },
    username: { errors: {} },
  });

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
