"use client";
import { React, useState, useEffect } from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import useAuth from "../hooks/useAuth";
import Chat from "../custom-components/Chat";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import * as Progress from "@radix-ui/react-progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
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

const KudoCard = ({ title, description, content, expires_on, logo }) => {
  return (
    <Card
      key={description}
      style={{ color: "#635D5D" }}
      className="w-40 max-h-35 h-35 text-[10px] flex flex-col grow justify-center"
    >
      <CardHeader>
        <CardTitle className="flex flex-row items-center justify-between mb-1">
          {title}
          <Avatar className="">
            <AvatarImage className="w-10 h-10" src={logo} />
          </Avatar>
        </CardTitle>
      </CardHeader>
      <CardContent className="grow-1">
        <p>{content}</p>
      </CardContent>
      <CardFooter>
        <p style={{ color: "#64748B" }}>
          <span className="font-bold text-[10px]">Expires:</span> {expires_on}
        </p>
      </CardFooter>
    </Card>
  );
};

const Circles = () => {
  return (
    <div className="flex space-x-2 flex-row items-center gap-2">
      <span
        style={{ borderColor: "#CBD5E1" }}
        className="w-6 h-6 border rounded-full"
      ></span>
      <span
        style={{ borderColor: "#E2E8F0" }}
        className="w-6 h-6 border rounded-full"
      ></span>
      <span
        style={{ borderColor: "#DCE6D5" }}
        className="w-6 h-6 border rounded-full"
      ></span>
    </div>
  );
};
//have two buttons one for prev and one for next
//on click of prev, we should check if our currPage is greater or equal to 1, if so then we can set currppage - 1
//on click of next, if currPage is less than totalpages we can increment
//if not within range set our disabled to true on either button being out of range and we can check on the next handle
//if === 1 then disabled true on prev and if total page == curr page - disable prev

const VolunteerPage = () => {
  const [progress, setProgress] = useState(13);
  const [currPage, setCurrPage] = useState(1);
  const itemsPerPage = 6;
  const [disablePrev, setDisablePrev] = useState(true);
  const [disableNext, setDisableNext] = useState(false);
  const [next, setNext] = useState(1);
  const [prev, setPrev] = useState(1);
  const [orders, setOrders] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [filteredOrders, setFilteredOrders] = [];
  const [dropOff, setDropOff] = useState("");
  const [pickUp, setPickUp] = useState("");
  const [dropOffCity, setDropOffCity] = useState("");
  const [pickUpCity, setPickUpCity] = useState("");
  const { user, logout, userId } = useAuth();
  const [orderToClaim, setOrderToClaim] = useState(null);
  const [orderClaimed, setOrderClaimed] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [popovers, setPopovers] = useState({});
  const [spinning, setIsSpinning] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Open Orders"); // 'stepper' is default

  const router = useRouter();

  const menuItems = [
    "Open Orders",
    "Track Kudos",
    "Completed Orders",
    "HeroAI",
  ];

  const handleRemoveOrder = () => {};

  const openOrders = orders.filter(
    (order) => order.status === "NEW" || order.status === "New"
  );

  //calculating how many pages we will have based on our items per page
  const totalPages = Math.ceil(openOrders.length / itemsPerPage);
  //get the correct "slice" from our data
  const currentOrders = openOrders.slice(
    (currPage - 1) * itemsPerPage,
    currPage * itemsPerPage
  );

  const handlePrev = () => {
    if (currPage > 1) {
      setCurrPage(currPage - 1);
    }
  };

  const handleNext = () => {
    if (currPage < totalPages) {
      setCurrPage(currPage + 1);
    }
  };

  const handleUpdateOrder = async (order_id, status) => {
    if ((orderStatus === null || orderStatus === "") && status !== "CLAIMED") {
      alert("Please choose a valid value!");
      return;
    }

    let payload;

    if (status === "CLAIMED") {
      payload = { status: status, order_id: order_id, volunteer_id: user.uid };
    } else {
      payload = { status: status, order_id: order_id };
    }

    try {
      const response = await fetch(
        "https://wastezeroapp.onrender.com/update_order",
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === order_id ? { ...order, status: status } : order
        )
      );
      setOrderStatus(null);
      console.log(response, "order update status");
    } catch (error) {
      console.error("Error", error);
    }
  };

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
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data, "respose data");
      setOrders(data);
    } catch (error) {
      console.error("Error", error);
    }
  };
  const handleOpenChange = (openState) => {
    setOpen(openState); // Directly set the new state when the popover opens or closes
  };

  const handleSubmit = (order_id, status) => {
    // if (!orderStatus) {
    //   alert("Please choose a valid value!");
    //   return;
    // }

    handleUpdateOrder(order_id, status); // Send update to backend
    setOrderStatus(""); // Reset RadioGroup selection
    setOpen(false); // Close Popover
  };

  const claimedOrders = orders
    .filter(
      (order) => order.status == "CLAIMED" || order.status == "IN-PROGRESS"
    ) // Filter by status
    .map((order, idx) => (
      <Popover key={order.id} className="cursor-pointer max-w-28">
        <PopoverTrigger asChild>
          <div // ⬅️ Change from button to div
            style={{ color: "#62738C" }}
            className="text-left text-xs cursor-pointer rounded-md bg-[#ebebeb] hover:border-[#A9CBAE] hover:border-1 hover:scale-105 hover:relative hover:left-2 flex flex-row mx-8 px-4 items-center gap-10 shadow-md py-3"
          >
            <p>
              {order.organization_name +
                "  " +
                order.available_until_time +
                "   " +
                order.status}
            </p>
            <div>
              <button className="text-xs bg-white text-[#32594A] font-bold rounded-md py-1.5 px-2">
                Update Status
              </button>
            </div>
            <ArrowDownCircleIcon width="20" height="20" />
          </div>
        </PopoverTrigger>

        <PopoverContent className="bg-white shadow-lg">
          <RadioGroup
            defaultValue=""
            // value={orderStatus}
            // onValueChange={setOrderStatus}
            className="flex flex-col gap-4 bg-transparent"
          >
            <div className="flex flex-row gap-2 items-left justify-left">
              <RadioGroupItem
                onClick={() => setOrderStatus("IN-PROGRESS")}
                value="in-progress"
                id="option-one"
              />
              <div className="flex text-[#64748B] flex-col">
                <Label htmlFor="option-one" className="font-bold text-xs">
                  Order has been picked up
                </Label>
                <p className="text-[9px] font-thin">
                  You have the order and are on the way!
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-2 items-left left-center">
              <RadioGroupItem
                onClick={() => setOrderStatus("DELIVERED")}
                value="DELIVERED"
                id="option-two"
              />
              <div className="flex text-[#64748B] flex-col">
                <Label htmlFor="option-two" className=" font-bold text-xs">
                  Order has been delivered
                </Label>
                <p className="text-[9px] font-thin">
                  Your point of contact has the order
                </p>
              </div>
            </div>
            <Button
              type="submit"
              className="bg-white text-black"
              onClick={() => {
                handleUpdateOrder(order.id, orderStatus);
              }}
            >
              Update
            </Button>
          </RadioGroup>
        </PopoverContent>
      </Popover>
    ));

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

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


  const toggleSpin = () => {
    // Trigger the spin animation by setting isSpinning to true
    setIsSpinning(true);

    // Reset the spinning state after 1 second (duration of animation)
    setTimeout(() => setIsSpinning(false), 2000); // 1s duration
  };


  if (user) {
    return (
      <div className="flex flex-col lg:flex-row lg:pr-24 items-center lg:items-start justify-center lg:justify-center lg:gap-12  gap-0  w-full mt-16">
        <div className="flex flex-col gap-8 fixed top-0 right-0 mr-8 mt-12">
          <Avatar className="" onClick={() => setShowSettings(!showSettings)}>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {showSettings && (
            <div className="absolute pt-16 cursor-pointer" onClick={logout}>
              Logout
            </div>
          )}
        </div>

        <div id="main_container" className="">
          {/* Menu Nav section */}
          <header style={{ color: "#62738C" }} className="">
            <Menubar className="shadow-md mt-4 mx-40 lg:mx-16  items-center justify-center">
              {menuItems.map((item, i) => (
                <MenubarMenu key={i}>
                  <MenubarTrigger
                    onClick={() => setActiveMenu(item)}
                    disabled={item === "Track Kudos"}
                    className={`hover:cursor-pointer disabled:text-gray-200 disabled:cursor-not-allowed ${
                      item === activeMenu ? `bg-[#64748B] !text-white` : ""
                    } text-bold text-xs lg:text-sm`}
                  >
                    {item}
                  </MenubarTrigger>
                </MenubarMenu>
              ))}
            </Menubar>
          </header>

          <div className="flex flex-col items-center justify-center mt-4">
            {activeMenu === "Open Orders" && (
              <div id="open_orders">
                {/* Filter section */}
                <div
                  id="filter_section"
                  style={{ color: "#593241" }}
                  className="flex flex-row gap-4 mx-20 lg:mx-0 items-center justify-center mt-8 relative mb-8 px-20"
                >
                  <div className="border border-1-solid p-1 rounded-full border-[#593241]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path d="M18.75 12.75h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM12 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 6ZM12 18a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 18ZM3.75 6.75h1.5a.75.75 0 1 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM5.25 18.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5ZM3 12a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3 12ZM9 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM12.75 12a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM9 15.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                    </svg>
                  </div>

                  <Select
                    className=""
                    disabled={true}
                    onValueChange={(value) =>
                      setPickUpCity((prevOptions) => [value])
                    }
                  >
                    <SelectTrigger className="bg-[#593241] text-white shadow-lg border border-2 border-[#593241]">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Oakland">Oakland</SelectItem>
                      <SelectItem value="San Francisco">
                        San Francisco
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    disabled={true}
                    onValueChange={(value) =>
                      setPickUp((prevOptions) => [value])
                    }
                  >
                    <SelectTrigger className="bg-[#593241] text-white shadow-lg border border-2 border-[#593241]">
                      <SelectValue placeholder="Drop Off Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9:00 AM</SelectItem>
                      <SelectItem value="10">10:00 AM</SelectItem>
                      <SelectItem value="11">11:00 AM</SelectItem>
                      <SelectItem value="12">12:00 PM</SelectItem>
                      <SelectItem value="1">1:00 PM</SelectItem>
                      <SelectItem value="2">2:00 PM</SelectItem>
                      <SelectItem value="3">3:00 PM</SelectItem>
                      <SelectItem value="4">4:00 PM</SelectItem>
                      <SelectItem value="5">5:00 PM</SelectItem>
                      <SelectItem value="6">6:00 PM</SelectItem>
                      <SelectItem value="7">7:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    disabled={true}
                    onValueChange={(value) =>
                      setDropOffCity((prevOptions) => [value])
                    }
                  >
                    <SelectTrigger className="bg-[#593241] text-white shadow-lg border border-2 border-[#593241]">
                      <SelectValue placeholder="Drop-off Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Oakland">Oakland</SelectItem>
                      <SelectItem value="San Francisco">
                        San Francisco
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                </div>

                {/* Available Orders section */}
                {orders.length > 0 && (
                  <div
                    disabled={orderClaimed}
                    className="flex flex-col gap-6 shadow-xxl mt-4 mx-20 max-h-72 h-72 bg-[#E5E7EB] border border-1-solid rounded-md py-4 overflow-scroll"
                  >
                    {currentOrders.map((company) => (
                      <Popover
                        key={company.id}
                        className="border border-solid border-2 border-black"
                      >
                        <PopoverTrigger
                          style={{ color: "#62738C" }}
                          className="text-left text-sm rounded-md bg-white  hover:scale-105 hover:relative hover:left-2 flex flex-row mx-8 px-4 justify-between shadow-md  py-3"
                        >
                          <p>
                            {company.organization_name +
                              "  " +
                              company.pickup_city +
                              "  " +
                              company.available_until_time +
                              "   " +
                              company.id}
                          </p>
                          <ArrowDownCircleIcon width="20" height="20" />
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="flex flex-col gap-2">
                            <div id="order_header pb-4">
                              <h2 className="text-sm">Order Info</h2>
                              <p className="text-xs">
                                Review details before claiming order
                              </p>
                            </div>
                            {/* TO DO: hook up buttons to claim order (set volunteer to an order in the list) or 
                    remove (simply hide it from the volunteers list) */}
                            <div className="text-xs">
                              <ul className="flex flex-col gap-1.5">
                                <li>Location: {company.pickup_address}</li>
                                <li>Quantity: Harcoded</li>
                                <li>Dropoff: Harcoded</li>
                                <li>Contact: Harcoded</li>
                              </ul>
                            </div>
                            <div className="rounded-sm text-xs flex flex-row mt-4 gap-4">
                              <Button
                                disabled={orderClaimed}
                                onClick={() => {
                                  setOrderStatus("CLAIMED");
                                  handleUpdateOrder(company.id, "CLAIMED");
                                }}
                                className="rounded-sm px-1.5 bg-blue-100 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 py-2"
                              >
                                Claim Order
                              </Button>
                              <Button
                                disabled={orderClaimed}
                                onClick={() => handleRemoveOrder()}
                                className="rounded-sm bg-blue-100 px-1.5 py-2 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                Remove Order
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>
                )}
                <div
                  id="controls"
                  style={{ color: "#593241" }}
                  className="flex flex-row justify-between lg:mt-10 mt-14 mb-10 mx-44"
                >
                  <Button
                    disabled={currPage == 1}
                    onClick={() => handlePrev()}
                    variant="outline"
                    size="icon"
                  >
                    <ChevronLeftIcon />
                  </Button>
                  {currPage}
                  <Button
                    disabled={
                      currPage == totalPages || currentOrders.length === 0
                    }
                    onClick={() => handleNext()}
                    variant="outline"
                    size="icon"
                  >
                    <ChevronRightIcon />
                  </Button>
                </div>
              </div>
            )}

            {activeMenu === "Completed Orders" && (
              <div>
                <Popover className="cursor-pointer text-[8px] mt-6">
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

            {activeMenu === "HeroAI" && <Chat user={user} />}
          </div>
        </div>

        {/* <div className="lg:h-96 w-2 mt-36 fixed ml-[40px] shadow-lg">
          <Separator
            orientation={"vertical"}
            className="lg:h-full hidden lg:flex"
          />
        </div> */}

        <div className="metrics_container flex flex-col justify-center items-center">
          <section className="relative flex flex-col text-left">
            <p className="text-sm mb-2 mt-10" style={{ color: "#64748B" }}>
              Food Saved in 2025
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
          <section className="mb-6 flex flex-col mt-8 relative">
            <div className="flex flex-col gap-1 max-w-full">
              <p
                style={{ color: "#64748B" }}
                className="text-sm font-semi-bold"
              >
                Available Kudos
              </p>
              <p
                style={{ color: "#64748B" }}
                className="text-xs font-thin mb-4"
              >
                Rewards for saving the world
              </p>
            </div>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="lg:min-w-[200px] max-w-[350px]"
            >
              <CarouselContent className="">
                {kudos.kudos.map((k, i) => (
                  <CarouselItem
                    key={i}
                    className="lg:basis-1/2 basis-1/2  cursor-pointer items-stretch flex"
                  >
                    <KudoCard {...k} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </section>
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p
                style={{ color: "#64748B" }}
                className="text-sm font-semi-bold"
              >
                Orders In-Progress
              </p>
              <p
                style={{ color: "#64748B" }}
                className="text-xs mb-1 font-thin"
              >
                Update the Status of Your Claimed Orders
              </p>
            </div>

            {claimedOrders.length ? (
              <div className="bg-white py-4 px-2 rounded-md flex max-h-44 border border-1 overflow-y-auto flex-col gap-6">
                {claimedOrders}
              </div>
            ) : (
              <div className="flex flex-row items-center justify-center">
                <Skeleton className="w-80 h-20 rounded-md border flex flex-col items-center justify-center"></Skeleton>
              </div>
            )}
          </section>
          <div className="fixed right-0 bg-[#62738C] text-white top-0 py-1.5 cursor-pointer hover:text-blue-200 flex-row min-w-full items-center justify-center">
            <p className="text-[.75rem] text-center">
              {" "}
              Need a refresher? Review the Volunteer Go-To Guide
            </p>
          </div>
          <footer className="fixed right-0 bottom-0 mr-6 mb-6">
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

export default VolunteerPage;
