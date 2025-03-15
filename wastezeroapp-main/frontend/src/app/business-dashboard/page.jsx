"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import Charts from "../custom-components/Charts";
import ContactForm from "../custom-components/ContactForm";
import { Apple, Cherry, Grape, Citrus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import useAuth from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Chat from "../custom-components/Chat";
import * as Progress from "@radix-ui/react-progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FunnelIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";

// import orders from "../data/orders.json";
import kudos from "../data/kudos.json";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";

const Stepper = () => {};

const BusinessDashboard = () => {
  const { user, logout, userId } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(13);
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bags, setBags] = useState("");
  const [zone, setZone] = useState("");
  const [spinning, setIsSpinning] = useState(false);
  const [orders, setOrders] = useState([]);
  const [preview, setPreview] = useState(null);
  const [containers, setContainers] = useState("");
  const [organization, setOrganization] = useState("");
  const [image, setImage] = useState(null);
  const [stepOneCompleted, setStepOneCompleted] = useState(false);
  const [stepTwoCompleted, setStepTwoCompleted] = useState(false);
  const [stepThreeCompleted, setStepThreeCompleted] = useState(false);
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("Create Order"); // 'stepper' is default
  const [hideForm, setHideForm] = useState(false);

  const menuItems = [
    "Create Order",
    "Track Donations",
    "Completed Orders",
    "HeroAI",
  ];

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        "https://wastezeroapp.onrender.com/get_orders",
        {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response) {
        throw new Error(`HTTP error!`);
      }

      const data = await response.json();
      console.log(data, "respose data");
      setOrders(data);
    } catch (error) {
      console.error("Error", error);
    }
  };

  const toggleSpin = () => {
    // Trigger the spin animation by setting isSpinning to true
    setIsSpinning(true);

    // Reset the spinning state after 1 second (duration of animation)
    setTimeout(() => setIsSpinning(false), 2000); // 1s duration
  };

  useEffect(() => {
    fetchOrders();

    // Set up WebSocket connection for real-time updates
    const socket = new WebSocket("wss://wastezeroapp.onrender.com/get_orders");
    socket.onmessage = (event) => {
      const updatedOrder = JSON.parse(event.data);

      // Update the state with the updated order
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    setStepOneCompleted(!!city && !!organization);
    setStepTwoCompleted(!!stepOneCompleted && !!bags && !!containers);
    setStepThreeCompleted(!!stepTwoCompleted && !!date && !!time);
  }, [
    date,
    time,
    zone,
    city,
    organization,
    bags,
    containers,
    stepOneCompleted,
    stepTwoCompleted,
    stepThreeCompleted,
  ]);

  const resetForm = () => {
    setStepOneCompleted(false);
    setStepTwoCompleted(false);
    setStepThreeCompleted(false);
    setCity("");
    setZone("");
    setDate("");
    setTime("");
    setBags("");
    setImage(null);
    setPreview(null);
    setOrganization("");
    setContainers("");
  };

  const handleSubmit = async () => {
    console.log("order submitted");

    const new_order = {
      organization_name: organization,
      pickup_city: city,
      pickup_address: zone,
      available_until_date: 2,
      available_until_time: 3,
      status: "New",
      business_id: user.uid,
    };

    try {
      const response = await fetch(
        "https://wastezeroapp.onrender.com/create_order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Make sure this is set
          },
          body: JSON.stringify(new_order),
          mode: "cors",
        }
      );

      if (!response.ok) {
        // Handle error: response not OK
        const errorResponse = await response.text(); // Get raw text if response isn't OK
        console.error("Error response:", errorResponse);
        return; // exit the function if the response is not successful
      }

      const parsedResponse = await response.json();
      console.log(parsedResponse, "parsed success or fail");

      setHideForm(true);
      resetForm();
    } catch (error) {
      console.error(error, "error");
    }
  };

  const inProgressOrders = orders.filter(
    (order) => order.status === "IN-PROGRESS"
  );

  const completedOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  );

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  if (user) {
    return (
      <div className="flex flex-col lg:flex-row  items-center lg:items-start  justify-center lg:justify-center lg:gap-20 relative lg:right-8 gap-0 w-full">
        <div className="flex flex-col gap-8 fixed top-0 right-0 mr-8 mt-4 ">
          <Avatar className="" onClick={() => setShowSettings(!showSettings)}>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {showSettings && (
            <div className="absolute pt-12 cursor-pointer" onClick={logout}>
              Logout
              {/* <Select>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" onClick={logout}>
                      Log Out
                    </SelectItem>
                    <SelectItem value="light">User Settings</SelectItem>
                  </SelectContent>
                </Select> */}
            </div>
          )}
        </div>

        <div className="">
          {/* Menu Nav section */}
          <header className="mt-6 lg:mx-0">
            <Menubar className="py-4 max-w-[600px] text-gray-600 flex flex-row shadow-lg items-center justify-between px-4">
              {menuItems.map((item, i) => (
                <MenubarMenu key={i}>
                  <MenubarTrigger
                    disabled={item === "Track Donations"}
                    onClick={() => setActiveMenu(item)}
                    className={`hover:cursor-pointer py-1 disabled:text-gray-200 disabled:cursor-not-allowed ${
                      item === activeMenu ? `bg-[#64748B] !text-white` : ""
                    } text-bold text-xs lg:text-sm`}
                  >
                    {item}
                  </MenubarTrigger>
                </MenubarMenu>
              ))}
            </Menubar>
          </header>

          <div className="flex flex-col items-left justify-left pl-10 mt-10">
            {activeMenu === "Create Order" && (
              <div className="">
                {hideForm ? (
                  <div className="flex flex-col items-center justify-start mt-10 h-96 gap-4">
                    <div className="bg-[#62738C] text-white shadow-2xl hover:scale-105 flex flex-col items-center justify-center gap-6 py-12 px-14 rounded-md">
                      <div> Order Created</div>
                      <p>You've saved</p>
                      <Button
                        className="bg-white text-gray-400"
                        onClick={() => setHideForm(!hideForm)}
                      >
                        New Order
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div id="stepper" className="flex flex-row items-start">
                      <div id="step_line">
                        <div
                          id="step_one"
                          className={`flex flex-col gap-2 mb-2 text-sm `}
                        >
                          <div className="flex flex-row gap-4 items-center justify-left text-sm">
                            <div
                              className={`border b-1 rounded-full p-2 relative right-3.5 border-[#8FC798]`}
                            >
                              <Apple size={16} className="text-[#8FC798]" />
                            </div>
                            <div className="text-[#8FC798] text-sm text-center mt-2 font-bold">
                              Where can we find this order?
                            </div>
                          </div>

                          <div className="flex flex-row items-center justify-left gap-2 text-white">
                            <Separator
                              className={`h-20 w-1 relative lg:flex ${
                                stepOneCompleted
                                  ? "bg-[#8FC798]"
                                  : "text-gray-400"
                              }`}
                              orientation={"vertical"}
                            />
                            <div className="flex flex-row gap-4 ml-8">
                              <Select
                                className=""
                                value={city}
                                onValueChange={(value) => setCity(value)}
                              >
                                <SelectTrigger className="bg-[#62738C]">
                                  <SelectValue
                                    className=""
                                    placeholder="City"
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">City</SelectItem>
                                  <SelectItem value="Oakland">
                                    Oakland
                                  </SelectItem>
                                  <SelectItem value="San Francisco">
                                    San Francisco
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={organization}
                                className=""
                                onValueChange={(value) =>
                                  setOrganization(value)
                                }
                              >
                                <SelectTrigger className="bg-[#62738C]">
                                  <SelectValue
                                    className=""
                                    placeholder="Organization"
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">
                                    All Organizations
                                  </SelectItem>
                                  <SelectItem value=" Urban Alchemy">
                                    Urban Alchemy
                                  </SelectItem>
                                  <SelectItem value="Oakland Food Bank">
                                    Oakland Food Bank
                                  </SelectItem>
                                  <SelectItem value="San Francisco Food Bank">
                                    San Francisco Food Bank
                                  </SelectItem>
                                  <SelectItem value="Mission St Shelter">
                                    Mission St Shelter
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="text"
                                disabled={true}
                                className="disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </div>

                        <div
                          id="step_two"
                          className={`flex flex-col gap-2 mb-2 text-xs ${
                            stepTwoCompleted ? "" : "text-gray-400"
                          }`}
                        >
                          <div className="flex flex-row gap-2 text-sm">
                            <div
                              className={`border b-1 rounded-full p-2 relative right-3.5 ${
                                stepOneCompleted
                                  ? "border-[#8FC798]"
                                  : "border-gray-400"
                              }`}
                            >
                              <Cherry
                                size={16}
                                className={` ${
                                  stepOneCompleted
                                    ? "text-[#8FC798]"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div
                              className={`mt-2 text-md font-bold ${
                                stepOneCompleted
                                  ? "text-[#8FC798]"
                                  : "text-grey-400"
                              }`}
                            >
                              {
                                " How large is your order? (Estimations are okay!)"
                              }
                            </div>
                          </div>

                          <div className="flex flex-row items-center gap24 text-white">
                            <Separator
                              orientation={"vertical"}
                              className={`h-16 w-1 relative lg:flex ${
                                stepTwoCompleted
                                  ? "bg-[#8FC798]"
                                  : "text-gray-400"
                              }`}
                            />
                            <div className="flex flex-row gap-4 items-center justify-center ml-10">
                              {/* Dropzone */}
                              {!image && (
                                <div
                                  {...getRootProps()}
                                  disabled={stepOneCompleted}
                                  className={`border-2 border-dashed p-6 rounded-md text-center transition ${
                                    stepOneCompleted
                                      ? isDragActive
                                        ? "border-blue-500 bg-blue-100 cursor-pointer"
                                        : "border-gray-400 bg-gray-100 cursor-pointer"
                                      : "border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  <input {...getInputProps()} />
                                  {isDragActive ? (
                                    <p className="text-blue-600">
                                      Drop the file here...
                                    </p>
                                  ) : (
                                    <p className="text-gray-600">
                                      Drag & drop an image here, or click to
                                      select
                                    </p>
                                  )}
                                </div>
                              )}
                              {/* Preview */}
                              {preview && (
                                <div className="">
                                  <img
                                    src={preview}
                                    alt="Preview"
                                    className=" max-w-26 max-h-20 object-cover rounded-md shadow-md"
                                  />
                                </div>
                              )}
                              <div className="flex flex-col gap-2">
                                <Select
                                  disabled={!stepOneCompleted}
                                  className=""
                                  onValueChange={(value) =>
                                    setContainers(value)
                                  }
                                >
                                  <SelectTrigger className="bg-[#62738C]">
                                    <SelectValue
                                      className=""
                                      placeholder="Containers"
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select
                                  disabled={!stepOneCompleted}
                                  className=""
                                  onValueChange={(value) => setBags(value)}
                                >
                                  <SelectTrigger className="bg-[#62738C]">
                                    <SelectValue
                                      className=""
                                      placeholder="Bags"
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectContent>
                                      <SelectItem value="1">1</SelectItem>
                                      <SelectItem value="2">2</SelectItem>
                                      <SelectItem value="3">3</SelectItem>
                                      <SelectItem value="4">4</SelectItem>
                                      <SelectItem value="5">5</SelectItem>
                                    </SelectContent>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          id="step_three"
                          className={`flex flex-col gap-2 mb-2 text-xs}`}
                        >
                          <div className="flex flex-row gap-2 text-sm">
                            <div
                              className={`border b-1 rounded-full p-2 relative right-3.5 ${
                                stepTwoCompleted
                                  ? "border-[#8FC798]"
                                  : "border-gray-400"
                              }`}
                            >
                              <Citrus
                                size={14}
                                className={` ${
                                  stepTwoCompleted
                                    ? "text-[#8FC798]"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>{" "}
                            <div
                              className={`mt-2 text-md font-bold ${
                                stepTwoCompleted
                                  ? "text-[#8FC798]"
                                  : "text-gray-400"
                              }`}
                            >
                              How long will this order be available?
                            </div>
                          </div>

                          <div className="flex flex-row items-center gap-4 text-white">
                            <Separator
                              orientation={"vertical"}
                              className={`h-20 w-1 relative lg:flex ${
                                stepThreeCompleted
                                  ? "bg-[#8FC798]"
                                  : "text-gray-400"
                              }`}
                            />
                            <div className="flex flex-row gap-4 ml-8">
                              <Select
                                className=""
                                value={date}
                                onValueChange={(value) => setDate(value)}
                                disabled={!stepTwoCompleted}
                              >
                                <SelectTrigger className="bg-[#62738C]">
                                  <SelectValue
                                    className=""
                                    placeholder="Date"
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Monday</SelectItem>
                                  <SelectItem value="2">Tuesday</SelectItem>
                                  <SelectItem value="3">Wednesday</SelectItem>
                                  <SelectItem value="4">Thursday</SelectItem>
                                  <SelectItem value="5">Friday</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                className=""
                                disabled={!stepTwoCompleted}
                                onValueChange={(value) => setTime(value)}
                              >
                                <SelectTrigger className="bg-[#62738C]">
                                  <SelectValue
                                    className=""
                                    placeholder="Time"
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1:00 PM</SelectItem>
                                  <SelectItem value="2">2:00 PM</SelectItem>
                                  <SelectItem value="3">3:00 PM</SelectItem>
                                  <SelectItem value="4">4:00 PM</SelectItem>
                                  <SelectItem value="5">5:00 PM</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div
                          id="step_four"
                          className={`flex flex-col gap-2 mb-2 text-xs`}
                        >
                          <div className="flex flex-row gap-4 text-sm">
                            <div
                              className={`border b-1 rounded-full p-2 relative right-3.5 ${
                                stepThreeCompleted
                                  ? "border-[#8FC798]"
                                  : "border-gray-400"
                              }`}
                            >
                              <Grape
                                size={16}
                                className={`${
                                  stepThreeCompleted
                                    ? "text-[#8FC798]"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>{" "}
                            <div
                              className={`mt-2 text-md font-bold ${
                                stepThreeCompleted
                                  ? "text-[#8FC798]"
                                  : "text-gray-400"
                              }`}
                            >
                              Does everything look okay?
                            </div>
                          </div>

                          <div className="flex flex-row items-center gap-4 text-white">
                            <Separator
                              orientation={"vertical"}
                              className={`h-8 w-1 relative lg:flex ${
                                stepThreeCompleted
                                  ? "bg-[#8FC798]"
                                  : "text-gray-400"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4 ">
                      <Button
                        onClick={() => handleSubmit()}
                        disabled={!stepThreeCompleted}
                        className={`w-28 text-white text-sm text-nowrap py-2 text-center rounded-sm mt-4 mb-10 
                 ${
                   stepThreeCompleted
                     ? "bg-[#8FC798]"
                     : "bg-gray-400 cursor-not-allowed"
                 }`}
                        type="submit"
                      >
                        Create
                      </Button>
                      <Button
                        onClick={() => resetForm()}
                        disabled={!city}
                        className={`w-28 text-white  text-sm rounded-sm px-2 py-1.5 mt-4 mb-10 
                 ${city ? "bg-[#8FC798]" : "bg-gray-400 cursor-not-allowed"}`}
                        type="submit"
                      >
                        Reset Form
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeMenu === "HeroAI" && <Chat user={user} />}

            {activeMenu === "Track Donations" && <div>Donations</div>}

            {activeMenu === "Completed Orders" && (
              <div className="flex flex-col gap-2 items-center mt-6 justify-center">
                <Popover className="cursor-pointer text-[8px]">
                  <PopoverTrigger asChild>
                    <div // ⬅️ Change from button to div
                      style={{ color: "#62738C" }}
                      className="text-left text-[12px] text-nowrap cursor-pointer rounded-md bg-[#ebebeb] hover:border-[#A9CBAE] hover:border-1 hover:scale-105 hover:relative hover:left-2 flex flex-row mx-8 px-4 items-center gap-10 shadow-md py-3"
                    >
                      <div>TechSphere</div>
                      <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-[10px]">Delivered</p>
                        <p>3/04/2025 12:36 PM</p>
                      </div>
                      <div></div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-6"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </PopoverTrigger>
                </Popover>
              </div>
            )}
          </div>
        </div>

        {/* Seperator */}

        <div className="mt-4 flex flex-col lg-mb-0 mb-20 gap-8 mr-22">
          <section className="relative flex flex-col text-left">
            <p
              className="text-sm mb-2 font-bold ml-2"
              style={{ color: "#64748B" }}
            >
              Food Donated in 2025
            </p>
            <Progress.Root
              className="ProgressRoot shadow-sm bg-slate-100"
              value={70}
            >
              <Progress.Indicator
                className="ProgressIndicator"
                style={{
                  transform: `translateX(-${100 - progress}%)`,
                  backgroundColor: "#A9CBAE",
                }}
              />
            </Progress.Root>
          </section>

          <section className="flex flex-col gap-2 mt-4">
            <div className="flex flex-col gap-2 mb-8">
              <p
                style={{ color: "#64748B" }}
                className="text-sm font-semi-bold"
              >
                View Reports
              </p>
              <p style={{ color: "#593241E5" }} className="text-xs font-thin">
                Insights on Your Contributions
              </p>

              <div className="bg-white shadow-lg max-w-[400px] rounded-sm mt-2 py-2 px-1">
                <Charts />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p
                style={{ color: "#64748B" }}
                className="text-sm font-semi-bold"
              >
                Orders In-Progress
              </p>
              <div className="flex flex-row gap-2 items-center">
                <div
                  id="refresh_button"
                  onClick={() => {
                    toggleSpin();
                    fetchOrders();
                  }}
                  className={` ${
                    spinning ? `spin` : ``
                  } cursor-pointer hover:scale-110`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#593241"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p style={{ color: "#593241E5" }} className="text-xs font-thin">
                  Claimed orders
                </p>
              </div>
            </div>

            {inProgressOrders.length === 0 ? (
              <div className="flex flex-row items-center justify-center ml-8 mt-4">
                <Skeleton className="w-full h-20 rounded-md border flex flex-col items-center justify-center">
                  {/* <Circles /> */}
                </Skeleton>
              </div>
            ) : (
              <div className="bg-white py-4 px-2 rounded-md flex max-h-44 max-w-[25rem] mt-4 border border-1 overflow-y-auto flex-col gap-6">
                {inProgressOrders.map((order, idx) => (
                  <Popover key={order.id} className="cursor-pointer text-[8px]">
                    <PopoverTrigger asChild>
                      <div // ⬅️ Change from button to div
                        style={{ color: "#62738C" }}
                        className="text-left text-[12px] text-nowrap cursor-pointer rounded-md bg-[#ebebeb] hover:border-[#A9CBAE] hover:border-1 hover:scale-105 hover:relative hover:left-2 flex flex-row mx-8 px-4 items-center gap-10 shadow-md py-3"
                      >
                        <div>{order.organization_name}</div>
                        <div className="flex flex-col items-center justify-center gap-1">
                          <p className="text-[10px]">{order.status}</p>
                        </div>
                        <div></div>
                        <ArrowDownCircleIcon width="20" height="20" />
                      </div>
                    </PopoverTrigger>
                  </Popover>
                ))}
              </div>
            )}
          </section>
          <footer className="fixed right-0 bottom-0 mr-6 mb-6">
            <Toggle
              size="lg"
              variant="outline"
              className="relative bg-gray-100 text-gray-100 cursor-not-allowed"
              style={{ borderColor: "#593241" }}
            >
              <MoonIcon
                style={{ borderColor: "#593241" }}
                className="h-6 w-6 fill-gray-400"
              />
              <SunIcon
                style={{ borderColor: "#32594A" }}
                className="h-6 w-6 fill-gray-400"
              />
            </Toggle>
            <div
              className="fixed bottom-0 mb-6 left-0 ml-6"
              style={{ color: "#593241" }}
            >
              <QuestionMarkCircleIcon width="30" height="30" />
            </div>
          </footer>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col items-center h-screen justify-center gap-4">
        {" "}
        <h1 className="text-3xl mb-20 font-geist" style={{ color: "#A9CBAE" }}>
          WASTE
          <span className="font-bold" style={{ color: "#32594A" }}>
            {" "}
            ZERO
          </span>
        </h1>
        <div> You need to be logged in to view this page.</div>{" "}
        <div
          className="underline font-geist font-bold cursor-pointer"
          onClick={() => router.push("/landing")}
        >
          Sign in Here.
        </div>{" "}
      </div>
    );
  }
};

export default BusinessDashboard;
