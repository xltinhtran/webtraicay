using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class Testimonial
{
    public int Id { get; set; }

    public string ClientName { get; set; } = null!;

    public string Profession { get; set; } = null!;

    public string Comment { get; set; } = null!;

    public int Rating { get; set; }

    public string ImageUrl { get; set; } = null!;
}
