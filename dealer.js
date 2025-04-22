var brandlist = ["Porsche", "Volkswagen", "Audi", "BMW"];
var carInventory = {
    "Porsche": 4,
    "Volkswagen": 6,
    "Audi": 5,
    "BMW": 3
};
var stats = {
    served: 0,
    sold: 0,
    amount: 0
};
var prices = {
    "Porsche": 650000,
    "Volkswagen": 180000,
    "Audi": 300000,
    "BMW": 250000
};

// Update stats on the page
function updateStats() {
    $("#clients_served").text(`${stats.served} clients`);
    $("#cars_sold").text(`${stats.sold} cars`);
    $("#amount").text(`RM ${stats.amount.toLocaleString(
	"en-MY", {minimumFractionDigits: 2})}`);
}

// Add new client to the queue
function newClient() {
    if ($("#clients_queue .client").length >= 10) {
        setTimeout(newClient, 3000);
        return;
    }

    var preference = Math.floor(Math.random() * 4);
    var clientId = Math.floor(Math.random() * 10) + 1;
    var brand = brandlist[preference];

    var $client = $(`
        <div class="client client_${clientId}" data-preference="${brand}">
            <span class="preference">Client for ${brand}</span>
        </div>`);

    $("#clients_queue").append($client);

    if ($("#clients_queue .client").length === 1) {
        makeDraggable($client);
    }

    setTimeout(newClient, Math.floor(Math.random() * 5000) + 3000);
}

// Make an element draggable
function makeDraggable($el) {
    $el.draggable({
        revert: "invalid",
        start: function () {
            // Allow dragging from car (not just queue)
            if ($(this).closest("#clients_queue").length && $(this).index() !== 0) {
                $(this).draggable("option", "revert", true);
            }
        }
    });
}

// Set the drop zones for car, cashier, and exit
function makeDroppables() {
    $(".place").droppable({
        accept: ".client",
        drop: function (event, ui) {
            var $client = $(ui.draggable);
            var preferred = $client.data("preference");
            var targetBrand = $(this).find("h4").text().trim().split('\n')[0];
            // Check if cars left in inventory
            if (carInventory[targetBrand] <= 0) {
                alert(targetBrand + " is sold out! Try another brand.");
                $client.css({ top: 0, left: 0 });
                return;
            }
            if (preferred !== targetBrand && carInventory[preferred] > 0) {
                alert("This customer wants to see " + preferred + " cars!");
                $client.css({ top: 0, left: 0 });
                return;
            }
            // Find available car slot (not used and not sold)
            var $availableCar = $(this).find(".car-img:not(.used):not(.sold)").first();
            if ($availableCar.length === 0) {
                alert("All " + targetBrand 
				+ " cars are either in use or sold. Wait for one to be free.");
                $client.css({ top: 0, left: 0 });
                return;
            }
            // Mark car as in-use and move client into it
            $availableCar.addClass("used");

            $client.data("brand", targetBrand);
            $client.data("assignedCar", $availableCar); // Store car for later release
            carInventory[targetBrand]--;
			var $next = $("#clients_queue .client").eq(1);
            if ($next.length) {
                makeDraggable($next);
            }

            $client.detach();
            $(this).append($client);

			
            $client.css({ position: "absolute", top: $availableCar.position().top, left: $availableCar.position().left });
            makeDraggable($client);
        }
    });



    // Cashier drop zone
	$("#cashier").droppable({
		accept: ".client",
		drop: function (event, ui) {
			var $client = $(ui.draggable);
			var brand = $client.data("brand");
	
			if (!brand) {
				alert("Customer must visit a car first!");
				$client.css({ top: 0, left: 0 });
				return;
			}
	
			// Create custom confirm box if not already created
			if ($("#customConfirm").length === 0) {
				$("body").append(`
					<div id="customConfirm" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999;">
						<div style="background:white; padding:20px 30px; border-radius:10px; text-align:center;">
							<p style="margin-bottom: 20px; font-size: 18px;">Would you like to purchase the car?</p>
							<button id="confirmYes" style="margin: 0 10px; padding:10px 20px;">YES</button>
							<button id="confirmNo" style="margin: 0 10px; padding:10px 20px;">NO</button>
						</div>
					</div>
				`);
			}
	
			// Show the confirm box and handle buttons
			$("#customConfirm").fadeIn();
	
			// YES
			// YES
			$("#confirmYes").off("click").on("click", function () {
				stats.served++;
				stats.sold++;
				stats.amount += prices[brand];

				var $assignedCar = $client.data("assignedCar"); // <-- Pindah ke sini

				if ($assignedCar && $assignedCar.length) {
					$assignedCar.addClass("sold");

					var $slot = $assignedCar.closest(".car-slot");
					$slot.append('<img src="images/sold2.jpg" class="sold-tag-img">');

					$assignedCar.removeClass("used");
				}

				updateStats();

				$client.fadeOut(400, function () {
					$(this).remove();
					var $next = $("#clients_queue .client").first();
					if ($next.length) makeDraggable($next);
					else newClient();
				});

				$("#customConfirm").fadeOut();
			});

	
			// NO
			$("#confirmNo").off("click").on("click", function () {
				stats.served++;
	
				var $assignedCar = $client.data("assignedCar");
				if ($assignedCar && $assignedCar.length) {
					$assignedCar.removeClass("used");
				}
	
				updateStats();
	
				$client.fadeOut(400, function () {
					$(this).remove();
					var $next = $("#clients_queue .client").first();
					if ($next.length) makeDraggable($next);
					else newClient();
				});
	
				$("#customConfirm").fadeOut();
			});
		}
	});
	

    // Exit drop zone
    $("#exit").droppable({
		accept: ".client",
		drop: function (event, ui) {
			var $client = $(ui.draggable);
	
			// Free the car
			var $assignedCar = $client.data("assignedCar");
			if ($assignedCar && $assignedCar.length) {
				$assignedCar.removeClass("used");
			}
	
			// Remove client after fade
			$client.fadeOut(400, function () {
				$(this).remove();
	
				// Selepas client dikeluarkan, check dan aktifkan client seterusnya
				var $next = $("#clients_queue .client").first();
				if ($next.length) {
					makeDraggable($next);
				} else {
					// Jika queue kosong, mulakan client baru
					setTimeout(function () {
						newClient();
					}, Math.floor((Math.random() * 3000) + 2000));
				}
			});
		}
	});
	
}

// Initialize on page load
$(document).ready(function () {
    updateStats();
    makeDroppables();
    newClient(); // Start adding clients
});
