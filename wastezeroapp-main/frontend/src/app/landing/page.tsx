"use client";
// import Image from "next/image";

import { useState, useEffect } from "react";
import { Toggle } from "@/components/ui/toggle";
import axios from "axios";
import useAuth from "../hooks/useAuth"
import {
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  GiftIcon,
  CheckIcon,
  EyeSlashIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import DeliveryIcon from "../landing.svg";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0QzOi4IXy9D9Gvat2GB9AFnWDMGLwUNY",
  authDomain: "wastezero-dcaba.firebaseapp.com",
  projectId: "wastezero-dcaba",
  storageBucket: "wastezero-dcaba.firebasestorage.app",
  messagingSenderId: "212670186625",
  appId: "1:212670186625:web:0243f9346d161cf8f87980",
  measurementId: "G-NWLMT7F0ZQ",
};

const formSchema = z.object({
  name: z.string().min(1).max(40).optional().or(z.literal("")),
  email: z.string().min(5).max(30), // Accepts emails with at least 5 characters
  password: z.string().min(6).max(20), // Accepts passwords with at least 6 characters
});

export default function Landing() {
  const [userState, setUserState] = useState<"new" | "existing" | "complete">(
    "existing"
  );
  const [userDetails, setUserDetails] = useState(null);
  const [currUser, setCurrUser] = useState(null);
  const [newUser, setIsNewUser] = useState(false);
  const [registerUser, setRegisterUser] = useState(false);
  const [role, setRole] = useState("volunteer");
  const [userUid, setUserUid] = useState(null);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null); // Store the Firebase UID
  const router = useRouter(); // Now this works because we're on the client
  const {user, login} = useAuth();

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth();

  //updates user with firebase event listener on auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrUser(user); // Update user state based on authentication status
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    console.log(userUid, "setUiserId");
  }, [userUid])

  //create form object with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  //when new user is created, send to backend and create user in table
  const sendUserDataToBackend = async (userCredentials, name) => {
    const payload = {
      uid: userCredentials.uid, // Unique Firebase ID
      email: userCredentials.email,
      displayName: name || userCredentials.displayName || "New User", // Default value
      role: role, // Example default role
      createdAt: new Date().toISOString(),
    };


    try {
      const response = await fetch("https://wastezeroapp.onrender.com/add_volunteer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        mode: "cors", // Make sure CORS mode is enabled
      });
      const data = await response.json();
      console.log(data, "parsed_data");
      return data; // Return the response data
    } catch (error) {
      console.error("Error:", error);
    }
  };

  //onSubmit
  const onSubmit = async (values: z.infer<typeof formSchema>) => {

    if (newUser) {
      try {
        //create user in firebase
        const userCredentials = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const firebaseUser = userCredentials.user;

        await updateProfile(firebaseUser, {
          displayName: values.name, // Assigning the user's name
        });

        // Send the updated user data (including displayName) to your backend
        const response = await sendUserDataToBackend(firebaseUser, values.name);
        // Use the response to set user details in your app
        setUserDetails(response.data);
        login(firebaseUser.uid)
        // Redirect the user to the dashboard

        if(role === "volunteer")  router.push("/volunteer-dashboard");
        else if (role === "business")  router.push("/business-dashboard");
       
      } catch (error) {
        console.error("error:", error);
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        console.log(userCredential, "user");
        const firebaseUser = userCredential.user;
        setUserUid(userCredential.user.uid);
        login(userCredential.user.uid)
        if(role === "volunteer")  router.push("/volunteer-dashboard");
        else if (role === "business")  router.push("/business-dashboard");
      } catch (error) {
        console.error("Error during sign-in:", error);
      }
    }
  };

  return (
    <div className="flex flex-row gap-20 pt-24 flex flex-wrap md:flex-nowrap items-center w-screen justify-center h-screen pb-14 font-[family-name:var(--font-geist-sans)]">
      {/* //question mark */}
      <header
        className="fixed flex flex-row w-full left-0 px-10 py-5 z-20 bg-white top-0 justify-between"
        style={{ color: "#593241" }}
      >
        <h1 className="tracking-wide text-xl " style={{ color: "#A9CBAE" }}>
          W A S T E
          <span className="font-bold" style={{ color: "#32594A" }}>
            {" "}
            Z E R O
          </span>
        </h1>
        <QuestionMarkCircleIcon width="30" height="30" />
      </header>

      {/* //modal and logo */}
      <div className="flex flex-col">
        <div className="bg-[#A9CBAE] max-w-[400px] py-6 rounded-xl flex flex-col items-center relative">
          <Toggle
            className="rounded-sm h-16 mt-6  py-4 mx-6 my-4"
            style={{ backgroundColor: "#FFFFFF", color: "#64748B" }}
          >

            {newUser ? (<> 
              <p onClick={() => setRole("volunteer")} className={`text-sm ${role == "volunteer" ? "bg-[#DCE6D5] py-2 px-2 rounded-sm": "py-1 px-2 rounded-sm"}`}>
           Sign Up to Volunteer
      </p>
    <p
      onClick={() => setRole("business")}
      className={`text-sm ${
        role == "business"
          ? "bg-[#DCE6D5] py-1 px-2 rounded-sm"
          : "py-1 px-2 rounded-sm"
      }`}
    >
      Sign Up as a Business
    </p>
            </>
   
            ) : (

              <> 
               <p
              onClick={() => setRole("volunteer")}
              className={`text-sm ${
                role == "volunteer"
                  ? "bg-[#DCE6D5] py-1 px-2 rounded-sm"
                  : "py-1 px-2 rounded-sm"
              }`}
            >
              Sign In as a Volunteer
            </p>
            <p
              onClick={() => setRole("business")}
              className={`text-sm ${
                role == "business"
                  ? "bg-[#DCE6D5] py-1 px-2 rounded-sm"
                  : "py-1 px-2 rounded-sm"
              }`}
            >
              Sign In as a Business
            </p>
              </>
            )}
      
          </Toggle>

          {newUser ? (
            <p className="text-xs text-center " style={{ color: "#32594A" }}>
              Already have an account? Login{" "}
              <span
                className="underline cursor-pointer"
                onClick={() => setIsNewUser(!newUser)}
              >
                here.
              </span>
            </p>
          ) : (
            <p className="text-xs text-center pt-4" style={{ color: "#32594A" }}>
              Ready to save the world? Create an account{" "}
              <span
                className="underline cursor-pointer"
                onClick={() => setIsNewUser(!newUser)}
              >
                here.
              </span>
            </p>
          )}
          <Form {...form}>
            <form
              onSubmit={(e) => {
                console.log("🔥 Form submitted!"); // Log before handleSubmit
                form.handleSubmit(onSubmit)(e);
              }}
              className="flex flex-col gap-2 text-slate-100 px-10 py-6 rounded-xl"
            >
              {newUser && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <div>
                          <Input className="bg-white w-60" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription></FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div>
                        <Input className="bg-white w-60" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="flex flex-row items-center gap-6">
                        <Input className="bg-white w-60" {...field} />
                        <EyeSlashIcon width="20" height="20" />
                      </div>
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>

              <Button
                type="submit"
                style={{ color: "#32594A", backgroundColor: "#DCE6D5" }}
                className="max-w-24 mt-4 text-slate-100 active:scale-95"
              >
                {newUser ? "Register" : "Login"}
              </Button>
            </form>
            <p
              style={{ color: "#32594A" }}
              className="text-xs flex flex-row justify-center mt-4 cursor-pointer"
            >
              Terms and Conditions
            </p>
          </Form>
        </div>
      </div>

      {/* //svg and items */}
      <div className="flex flex-col gap-8 pb-8 items-center justify-center text-sm">
        <img src="/landing.svg" className="max-w-[250px] w-full h-auto" />
        <div className="flex flex-col gap-14 items-left">
          <div style={{ color: "#32594A" }} className="flex flex-row gap-6 hover:scale-110 cursor-pointer">
            <MagnifyingGlassIcon width="20" height="20" />
            <p className="text-xs">
              Search open orders by city, pickup zone, or drop off location
            </p>
          </div>
          <div stylw={{ color: "#593241" }} className="flex flex-row gap-6 hover:scale-110 cursor-pointer">
            <CheckIcon width="20" height="20"  className=""/>
            <p className="text-xs">
              Claim an order that works with your schedule
            </p>
          </div>
          <div style={{ color: "#32594A" }} className="flex flex-row gap-6 hover:scale-110 cursor-pointer">
            <GiftIcon width="20" height="20" />
            <p className="text-xs">
              Confirm your order was delivered and earn your kudos!
            </p>
          </div>
        </div>
      </div>

      {/* //modal and logo */}
      <footer className="fixed bottom-0 mb-6 right-0 mr-6">
        <Toggle
          size="lg"
          variant="outline"
          className="relative"
          style={{ borderColor: "#593241" }}
        >
          <MoonIcon
            style={{ borderColor: "#593241" }}
            className="h-6 w-6 fill-current text-accent-foreground"
          />
          <SunIcon
            style={{ borderColor: "#32594A" }}
            className="h-6 w-6 fill-current text-accent-foreground"
          />
        </Toggle>
      </footer>
    </div>
  );
}
